import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pine-upload-'));
mock.module('../backend/src/config/index.js', { namedExports: { config: { uploadsDir: directory, isProduction: false } } });
mock.module('../backend/src/models/Product.js', { namedExports: { Product: { findById: () => ({ select: () => ({ lean: async () => ({ name: 'Renamed', photos: ['/uploads/snow-diva-t-shirt-picture-01.webp'] }) }) }) } } });
const { convertUploadedMedia } = await import('../backend/src/middleware/upload.js');
test('dashboard conversion creates valid WebP with canonical names for create and edit', async () => {
  try {
    const buffer = await sharp({ create: { width: 2, height: 3, channels: 3, background: 'red' } }).png().toBuffer();
    const convert = async (params) => {
      const req = { params, body: { name: 'SNOW DIVA T-shirt' }, files: { photos: [{ buffer, mimetype: 'image/png', originalname: 'IMG_001.png' }] } };
      await convertUploadedMedia(req, {}, (error) => { if (error) throw error; });
      return req.files.photos[0].filename;
    };
    assert.equal(await convert({}), 'snow-diva-t-shirt-picture-01.webp');
    assert.equal(await convert({ id: 'existing' }), 'snow-diva-t-shirt-picture-02.webp');
    const image = await sharp(path.join(directory, 'snow-diva-t-shirt-picture-02.webp')).metadata();
    assert.equal(image.format, 'webp');
    assert.equal(image.width, 2);
    assert.equal(image.height, 3);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
