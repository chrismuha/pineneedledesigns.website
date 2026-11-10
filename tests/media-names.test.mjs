import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { mediaSlug, reserveMediaFilename } from '../backend/src/utils/mediaNames.js';

test('media titles become readable names and existing canonical slugs survive renames', () => {
  assert.equal(mediaSlug('SNOW DIVA T-shirt'), 'snow-diva-t-shirt');
  assert.equal(mediaSlug("Bébé’s Wild Card!"), 'bebes-wild-card');
  assert.equal(mediaSlug('New Name', ['/uploads/old-rose-picture-06.webp']), 'old-rose');
});
test('parallel reservations preserve retained files and use unused padded numbers', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pine-media-'));
  try {
    await fs.writeFile(path.join(directory, 'snow-diva-picture-01.webp'), 'retained');
    const names = await Promise.all(Array.from({ length: 3 }, () => reserveMediaFilename(directory, 'snow-diva', 'picture')));
    assert.deepEqual(names.sort(), ['snow-diva-picture-02.webp', 'snow-diva-picture-03.webp', 'snow-diva-picture-04.webp']);
    assert.equal(await fs.readFile(path.join(directory, 'snow-diva-picture-01.webp'), 'utf8'), 'retained');
    assert.equal(await reserveMediaFilename(directory, 'snow-diva', 'video'), 'snow-diva-video-01.webm');
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
