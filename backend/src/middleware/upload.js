import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { execFile } from 'child_process';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import multer from 'multer';
import sharp from 'sharp';
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

const uniqueBase = () => `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

export const SYNC_TRANSCODE_MAX_BYTES = 15 * 1024 * 1024;

const VIDEO_CONCURRENCY = config.isProduction
  ? 1
  : Math.max(1, Math.min(2, os.cpus().length - 1));

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
  const filename = `${uniqueBase()}.webp`;
  await sharp(file.buffer).rotate().webp({ quality: 85 }).toFile(path.join(config.uploadsDir, filename));
  return { ...file, filename, mimetype: 'image/webp', pendingTranscode: false };
};

// Small video: transcode synchronously and return the final .webm right away.
const convertVideoSync = async (file) => {
  const base = uniqueBase();
  const input = path.join(config.uploadsDir, `${base}${path.extname(file.originalname) || '.video'}`);
  const filename = `${base}.webm`;
  const startedAt = Date.now();

  await fs.writeFile(input, file.buffer);
  try {
    await transcodeToWebm(input, path.join(config.uploadsDir, filename));
  } finally {
    await fs.unlink(input).catch(() => {});
  }

  console.log(`[upload] sync-transcoded ${file.originalname} in ${Date.now() - startedAt}ms`);
  return { ...file, filename, mimetype: 'video/webm', pendingTranscode: false };
};

const persistVideoRaw = async (file) => {
  const base = uniqueBase();
  const extension = path.extname(file.originalname) || '.video';
  const filename = `${base}${extension}`;

  await fs.writeFile(path.join(config.uploadsDir, filename), file.buffer);

  console.log(`[upload] deferring transcode for ${file.originalname} (${(file.buffer.length / 1024 / 1024).toFixed(1)}MB > sync threshold)`);
  return { ...file, filename, mimetype: file.mimetype, pendingTranscode: true };
};

const convertVideo = (file) => (
  file.buffer.length <= SYNC_TRANSCODE_MAX_BYTES ? convertVideoSync(file) : persistVideoRaw(file)
);

const convertMediaList = async (files) => {
  const images = files.filter((file) => file.mimetype.startsWith('image/'));
  const videos = files.filter((file) => file.mimetype.startsWith('video/'));

  const [convertedImages, convertedVideos] = await Promise.all([
    Promise.all(images.map(convertImage)),
    runLimited(videos, VIDEO_CONCURRENCY, convertVideo),
  ]);

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