import fs from 'fs/promises';
import path from 'path';
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

const convertFile = async (file) => {
  const base = uniqueBase();
  if (file.mimetype.startsWith('image/')) {
    const filename = `${base}.webp`;
    await sharp(file.buffer).rotate().webp({ quality: 85 }).toFile(path.join(config.uploadsDir, filename));
    return { ...file, filename, mimetype: 'image/webp' };
  }

  const input = path.join(config.uploadsDir, `${base}${path.extname(file.originalname) || '.video'}`);
  const filename = `${base}.webm`;
  await fs.writeFile(input, file.buffer);
  try {
    await run(ffmpeg.path, ['-y', '-i', input, '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-c:a', 'libopus', path.join(config.uploadsDir, filename)]);
  } finally {
    await fs.unlink(input).catch(() => {});
  }
  return { ...file, filename, mimetype: 'video/webm' };
};

export const convertUploadedMedia = async (req, _res, next) => {
  try {
    if (Array.isArray(req.files)) {
      req.files = await Promise.all(req.files.map(convertFile));
    } else if (req.files) {
      for (const [field, files] of Object.entries(req.files)) {
        req.files[field] = await Promise.all(files.map(convertFile));
      }
    }
    next();
  } catch (error) {
    next(new Error(`Media conversion failed: ${error.message}`));
  }
};

export default upload;
