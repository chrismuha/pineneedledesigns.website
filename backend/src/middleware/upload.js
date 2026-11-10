import { removeUploadedMedia } from '../services/catalogAudit.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { execFile } from 'child_process';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import multer from 'multer';
import sharp from 'sharp';
import { Product } from '../models/Product.js';
import { mediaSlug, reserveMediaFilename } from '../utils/mediaNames.js';
import { config } from '../config/index.js';

await fs.mkdir(config.uploadsDir, { recursive: true });
const run = promisify(execFile);

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) return cb(null, true);
    return cb(new Error('Only image and video files are allowed.'));
  },
  limits: { fileSize: 100 * 1024 * 1024, files: 30 },
});

export const SYNC_TRANSCODE_MAX_BYTES = 15 * 1024 * 1024;

const CPU_COUNT = os.cpus().length;
const IMAGE_CONCURRENCY = Math.max(1, Math.min(2, Math.ceil(CPU_COUNT / 4)));
const VIDEO_CONCURRENCY = config.isProduction
  ? 1
  : Math.max(1, Math.min(2, Math.ceil(CPU_COUNT / 4)));

const runLimited = async (items, limit, worker) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  const runNext = async () => {
    const currentIndex = nextIndex;
    nextIndex += 1;
    if (currentIndex >= items.length) return;
    results[currentIndex] = await worker(items[currentIndex], currentIndex);
    await runNext();
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runNext());
  await Promise.all(workers);
  return results;
};

export const transcodeToWebm = async (inputPath, outputPath) => {
  await run(ffmpeg.path, [
    '-y',
    '-i', inputPath,
    '-c:v', 'libvpx-vp9',
    '-crf', '32',
    '-b:v', '0',
    '-deadline', 'realtime',
    '-cpu-used', '5',
    '-threads', '2',
    '-row-mt', '1',
    '-c:a', 'libopus',
    outputPath,
  ]);
};

const convertImage = async (file) => {
  const filename = file.canonicalFilename;
  await sharp(file.buffer).rotate().webp({ quality: 85 }).toFile(path.join(config.uploadsDir, filename));
  return { ...file, filename, mimetype: 'image/webp', pendingTranscode: false };
};

// Small video: transcode synchronously and return the final .webm right away.
const convertVideoSync = async (file) => {
  const base = path.basename(file.canonicalFilename, '.webm');
  const input = path.join(config.uploadsDir, `${base}.source-video`);
  const filename = `${base}.webm`;
  const startedAt = Date.now();

  await fs.writeFile(input, file.buffer);
  try {
    await transcodeToWebm(input, path.join(config.uploadsDir, filename));
  } finally {
    await removeUploadedMedia(`/uploads/${path.basename(input)}`, 'Temporary source video cleanup after conversion attempt').catch(() => {});
  }

  console.log(`[upload] sync-transcoded ${file.originalname} in ${Date.now() - startedAt}ms`);
  return { ...file, filename, mimetype: 'video/webm', pendingTranscode: false };
};

const persistVideoRaw = async (file) => {
  const base = path.basename(file.canonicalFilename, '.webm');
  const extension = `.pending${path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.video'}`;
  const filename = `${base}${extension}`;

  await fs.writeFile(path.join(config.uploadsDir, filename), file.buffer);

  console.log(`[upload] deferring transcode for ${file.originalname} (${(file.buffer.length / 1024 / 1024).toFixed(1)}MB > sync threshold)`);
  return { ...file, filename, mimetype: file.mimetype, pendingTranscode: true };
};

const convertVideo = (file) => (
  file.buffer.length <= SYNC_TRANSCODE_MAX_BYTES ? convertVideoSync(file) : persistVideoRaw(file)
);

const convertMediaList = async (files) => {
  const startedAt = Date.now();
  const images = files.filter((file) => file.mimetype.startsWith('image/'));
  const videos = files.filter((file) => file.mimetype.startsWith('video/'));

  const [convertedImages, convertedVideos] = await Promise.all([
    runLimited(images, IMAGE_CONCURRENCY, convertImage),
    runLimited(videos, VIDEO_CONCURRENCY, convertVideo),
  ]);

  console.log(
    `[upload] converted ${images.length} image(s) and ${videos.length} video(s) in ${Date.now() - startedAt}ms `
      + `(imageConcurrency=${IMAGE_CONCURRENCY}, videoConcurrency=${VIDEO_CONCURRENCY})`,
  );

  return files.map((original) => {
    const isImage = original.mimetype.startsWith('image/');
    const pool = isImage ? convertedImages : convertedVideos;
    const sourcePool = isImage ? images : videos;
    const poolIndex = sourcePool.indexOf(original);
    return pool[poolIndex];
  });
};

export const convertUploadedMedia = async (req, _res, next) => {
  try {
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat();
    if (files.length) {
      const product = req.params?.id ? await Product.findById(req.params.id).select('name photos videos').lean() : null;
      const title = String(product?.name || req.body?.name || '').trim();
      if (!title) throw new Error('A product name is required before uploading media.');
      const slug = mediaSlug(title, [...(product?.photos || []), ...(product?.videos || [])]);
      // Reserve all names before parallel conversion. Retained files and pending
      // videos also occupy their numbers, so later uploads cannot overwrite them.
      for (const file of files) {
        file.canonicalFilename = await reserveMediaFilename(config.uploadsDir, slug,
          file.mimetype.startsWith('image/') ? 'picture' : 'video');
      }
    }
    if (Array.isArray(req.files)) {
      req.files = await convertMediaList(req.files);
    } else if (req.files) {
      const entries = Object.entries(req.files);
      const convertedEntries = await Promise.all(
        entries.map(async ([field, files]) => [field, await convertMediaList(files)]),
      );
      req.files = Object.fromEntries(convertedEntries);
    }
    next();
  } catch (error) {
    next(new Error(`Media conversion failed: ${error.message}`));
  }
};

export default upload;