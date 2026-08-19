import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { config } from '../config/index.js';
import { Product } from '../models/Product.js';
import { transcodeToWebm } from '../middleware/upload.js';

// A small counting semaphore. This is a module-level singleton, so it caps
// ffmpeg concurrency across ALL background jobs server-wide (not just within
// a single request), which matters once multiple uploads land close together.
class Semaphore {
  constructor(max) {
    this.max = max;
    this.current = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.current < this.max) {
      this.current += 1;
      return;
    }
    await new Promise((resolve) => { this.queue.push(resolve); });
    this.current += 1;
  }

  release() {
    this.current -= 1;
    const next = this.queue.shift();
    if (next) next();
  }

  async run(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

const BACKGROUND_VIDEO_CONCURRENCY = 1;
const backgroundSemaphore = new Semaphore(BACKGROUND_VIDEO_CONCURRENCY);

const uploadsPathFor = (filename) => path.join(config.uploadsDir, filename);
const uploadsUrlFor = (filename) => `/uploads/${filename}`;

const unlinkQuiet = async (filename) => {
  await fs.unlink(uploadsPathFor(filename)).catch((error) => {
    if (error?.code !== 'ENOENT') console.error(`[videoTranscoder] failed to remove ${filename}:`, error);
  });
};

const transcodeOne = async ({ productId, rawFilename }) => {
  const startedAt = Date.now();
  const base = path.basename(rawFilename, path.extname(rawFilename));
  const finalFilename = `${base}.webm`;
  const rawUrl = uploadsUrlFor(rawFilename);
  const finalUrl = uploadsUrlFor(finalFilename);

  try {
    await transcodeToWebm(uploadsPathFor(rawFilename), uploadsPathFor(finalFilename));

    // Swap the raw path for the transcoded one, but only where it's still
    // actually referenced — the product may have been edited or deleted
    // while this was transcoding in the background.
    const result = await Product.updateOne(
      { _id: productId, videos: rawUrl },
      { $set: { 'videos.$': finalUrl } },
    );

    await unlinkQuiet(rawFilename);

    if (result.modifiedCount === 0) {
      // Nothing referenced the raw path anymore (product deleted, or the
      // video was removed in a later edit) — the freshly-made file is
      // orphaned, so clean it up too instead of leaving it on disk forever.
      await unlinkQuiet(finalFilename);
      console.log(`[videoTranscoder] ${rawFilename} transcoded but no longer referenced by product ${productId}; cleaned up.`);
      return;
    }

    console.log(`[videoTranscoder] background-transcoded ${rawFilename} -> ${finalFilename} in ${Date.now() - startedAt}ms (product ${productId})`);
  } catch (error) {
    // Leave the raw file in place on failure — it's still a playable video
    // (just not the optimized webm), which is strictly better than losing
    // it. Log loudly so this shows up in your DO logs/monitoring.
    console.error(`[videoTranscoder] failed to transcode ${rawFilename} for product ${productId}:`, error);
  }
};

/**
 * Queue background transcoding for videos that were saved raw because they
 * were too large to safely transcode within the request/response cycle.
 * Fire-and-forget by design: callers should NOT await this before responding
 * to the client — that would defeat the entire point of deferring the work.
 *
 * @param {object} params
 * @param {string|import('mongoose').Types.ObjectId} params.productId
 * @param {Array<{ filename: string, pendingTranscode?: boolean }>} params.files
 */
export const queueVideoTranscode = ({ productId, files }) => {
  const pending = (files || []).filter((file) => file.pendingTranscode);
  if (!pending.length) return;

  pending.forEach((file) => {
    // Each individual job still goes through the shared semaphore so we
    // never run more than BACKGROUND_VIDEO_CONCURRENCY ffmpeg processes at
    // once, regardless of how many requests triggered jobs concurrently.
    backgroundSemaphore.run(() => transcodeOne({ productId, rawFilename: file.filename }));
  });
};