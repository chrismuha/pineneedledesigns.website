import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';

import { config } from '../config/index.js';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';

const LEGACY_MEDIA_PATTERN = /^\/(images|videos)\//;
const MEDIA_FIELDS = ['photos', 'videos', 'videoPosters'];

const isLegacyMediaUrl = (value) => LEGACY_MEDIA_PATTERN.test(String(value || ''));

const migratedUrlFor = (legacyUrl) => {
  const extension = path.extname(legacyUrl).toLowerCase();
  const digest = crypto.createHash('sha256').update(legacyUrl).digest('hex').slice(0, 20);
  return `/uploads/legacy-${digest}${extension}`;
};

const sourcePathFor = (legacyUrl) => path.join(config.docsDir, legacyUrl.replace(/^\//, ''));
const destinationPathFor = (uploadUrl) => path.join(config.uploadsDir, path.basename(uploadUrl));

const replaceLegacyUrls = (values, migrations) => (values || []).map((value) => (
  migrations.get(value) || value
));

const collectLegacyUrls = (products, collections) => {
  const urls = new Set();

  for (const product of products) {
    for (const field of MEDIA_FIELDS) {
      for (const value of product[field] || []) {
        if (isLegacyMediaUrl(value)) urls.add(value);
      }
    }
  }

  for (const collection of collections) {
    if (isLegacyMediaUrl(collection.cardImage)) urls.add(collection.cardImage);
  }

  return [...urls].sort();
};

const validateSources = async (legacyUrls) => {
  const missing = [];
  for (const legacyUrl of legacyUrls) {
    try {
      const stats = await fs.stat(sourcePathFor(legacyUrl));
      if (!stats.isFile()) missing.push(legacyUrl);
    } catch {
      missing.push(legacyUrl);
    }
  }
  return missing;
};

const copyLegacyMedia = async (migrations) => {
  await fs.mkdir(config.uploadsDir, { recursive: true });

  for (const [legacyUrl, uploadUrl] of migrations) {
    const source = sourcePathFor(legacyUrl);
    const destination = destinationPathFor(uploadUrl);
    const sourceStats = await fs.stat(source);
    try {
      const destinationStats = await fs.stat(destination);
      if (destinationStats.size !== sourceStats.size) {
        throw new Error(`Existing upload differs from its legacy source: ${uploadUrl}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const temporary = `${destination}.migration-${process.pid}`;
      await fs.copyFile(source, temporary);
      await fs.rename(temporary, destination);
    }
  }
};

const buildProductUpdates = (products, migrations) => products.flatMap((product) => {
  const $set = {};
  for (const field of MEDIA_FIELDS) {
    const current = product[field] || [];
    const migrated = replaceLegacyUrls(current, migrations);
    if (migrated.some((value, index) => value !== current[index])) $set[field] = migrated;
  }

  return Object.keys($set).length
    ? [{ updateOne: { filter: { _id: product._id }, update: { $set } } }]
    : [];
});

const buildCollectionUpdates = (collections, migrations) => collections.flatMap((collection) => {
  const cardImage = migrations.get(collection.cardImage);
  return cardImage
    ? [{ updateOne: { filter: { _id: collection._id }, update: { $set: { cardImage } } } }]
    : [];
});

const countRemainingLegacyReferences = async () => {
  const [products, collections] = await Promise.all([
    Product.find().select(MEDIA_FIELDS.join(' ')).lean(),
    Collection.find().select('cardImage').lean(),
  ]);

  return collectLegacyUrls(products, collections).length;
};

const run = async () => {
  const apply = process.argv.includes('--apply');
  if (process.argv.includes('--help')) {
    console.log('Usage: node src/scripts/migrateLegacyMedia.js [--apply]');
    console.log('Without --apply, validates and reports the planned migration without changing files or MongoDB.');
    return;
  }

  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 15_000 });
  try {
    const [products, collections] = await Promise.all([
      Product.find().select(`_id ${MEDIA_FIELDS.join(' ')}`).lean(),
      Collection.find().select('_id cardImage').lean(),
    ]);
    const legacyUrls = collectLegacyUrls(products, collections);
    const missing = await validateSources(legacyUrls);

    console.log(`Legacy media URLs: ${legacyUrls.length}`);
    if (missing.length) {
      throw new Error(`Migration stopped because ${missing.length} source file(s) are missing:\n${missing.join('\n')}`);
    }
    if (!legacyUrls.length) {
      console.log('No legacy media references remain.');
      return;
    }

    const migrations = new Map(legacyUrls.map((url) => [url, migratedUrlFor(url)]));
    const productUpdates = buildProductUpdates(products, migrations);
    const collectionUpdates = buildCollectionUpdates(collections, migrations);

    console.log(`Products to update: ${productUpdates.length}`);
    console.log(`Collections to update: ${collectionUpdates.length}`);
    if (!apply) {
      console.log('Dry run complete. Re-run with --apply to copy media and update MongoDB.');
      return;
    }

    await copyLegacyMedia(migrations);
    if (productUpdates.length) await Product.bulkWrite(productUpdates);
    if (collectionUpdates.length) await Collection.bulkWrite(collectionUpdates);

    const remaining = await countRemainingLegacyReferences();
    if (remaining) throw new Error(`${remaining} unique legacy media reference(s) remain after migration.`);

    console.log(`Migrated ${legacyUrls.length} legacy media file(s) to ${config.uploadsDir}.`);
    console.log('Verified: zero legacy media references remain in MongoDB.');
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
