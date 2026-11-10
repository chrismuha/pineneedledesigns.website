import fs from 'node:fs/promises';
import path from 'node:path';

export const mediaSlug = (title, urls = []) => {
  for (const url of urls) {
    const match = String(url).match(/^\/uploads\/([a-z0-9]+(?:-[a-z0-9]+)*)-(?:picture|video)-\d{2,}(?:-cropped)?\.[a-z0-9]+$/);
    if (match) return match[1];
  }
  const slug = String(title).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new Error('Use a readable product name before uploading media.');
  return slug;
};

export const reserveMediaFilename = async (directory, slug, kind) => {
  const extension = kind === 'picture' ? 'webp' : 'webm';
  for (let number = 1; ; number += 1) {
    const filename = `${slug}-${kind}-${String(number).padStart(2, '0')}.${extension}`;
    try {
      const handle = await fs.open(path.join(directory, filename), 'wx');
      await handle.close();
      return filename;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
};
