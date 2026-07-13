import mongoose from 'mongoose';
import { config } from './index.js';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Subcollection } from '../models/Subcollection.js';
import { slugify } from '../utils/slug.js';

const ensureMyraBeltsSubcollection = async () => {
  const myra = await Collection.findOne({
    isSystem: false,
    $or: [
      { name: /^myra$/i },
      { slug: 'myra' },
    ],
  }).lean();

  if (!myra) return;

  const existing = await Subcollection.findOne({
    collectionId: myra._id,
    $or: [
      { name: /^belts$/i },
      { slug: 'belts' },
    ],
  });

  if (existing) return;

  const lastSubcollection = await Subcollection.findOne({ collectionId: myra._id })
    .sort({ sortOrder: -1 })
    .select('sortOrder')
    .lean();

  await Subcollection.create({
    collectionId: myra._id,
    name: 'Belts',
    slug: slugify('Belts'),
    sortOrder: (lastSubcollection?.sortOrder ?? -1) + 1,
  });
  console.log('ℹ️ Added the Belts sub-collection under MYRA.');
};

const renameNaturalWhiteColors = async () => {
  const legacyLabel = /^white\s*\(natural\)$/i;
  const products = await Product.find({
    $or: [
      { color: /white\s*\(natural\)/i },
      { calmColors: legacyLabel },
      { 'customProperties.options': legacyLabel },
    ],
  });

  for (const product of products) {
    product.color = [...new Set(String(product.color || '')
      .split(',')
      .map((color) => legacyLabel.test(color.trim()) ? 'Natural White' : color.trim())
      .filter(Boolean))]
      .join(', ');
    product.calmColors = [...new Set((product.calmColors || []).map(
      (color) => legacyLabel.test(String(color).trim()) ? 'Natural White' : color,
    ))];
    product.customProperties = (product.customProperties || []).map((property) => ({
      ...(typeof property.toObject === 'function' ? property.toObject() : property),
      options: [...new Set((property.options || []).map(
        (option) => legacyLabel.test(String(option).trim()) ? 'Natural White' : option,
      ))],
    }));
    await product.save();
  }

  if (products.length) {
    console.log(`ℹ️ Renamed White (Natural) to Natural White for ${products.length} products.`);
  }
};

const backfillNoBlingDescriptions = async () => {
  const shirts = await Collection.findOne({
    isSystem: false,
    $or: [
      { name: /^shirts$/i },
      { slug: 'shirts' },
    ],
  }).lean();

  if (!shirts) return;

  const products = await Product.find({
    collectionId: shirts._id,
    noBlingPrice: { $ne: null },
    $or: [
      { noBlingDescription: { $exists: false } },
      { noBlingDescription: null },
      { noBlingDescription: /^\s*$/ },
    ],
  }).select('name');

  for (const product of products) {
    const cleanTitle = String(product.name || '')
      .replace(/\bblinged\s+out\b\s*/gi, '')
      .replace(/\bblinged\b\s*/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    product.noBlingDescription = `${cleanTitle} without added bling.`;
    await product.save();
  }

  if (products.length) {
    console.log(`ℹ️ Added missing No Bling descriptions for ${products.length} shirts.`);
  }
};

const inferSubcollectionName = (productName, subcollectionNames) => {
  const name = String(productName || '').toLowerCase();
  const sorted = [...subcollectionNames].sort((left, right) => right.length - left.length);

  for (const subcollectionName of sorted) {
    const key = subcollectionName.toLowerCase();

    if (key === 't-shirts' && (name.includes('t-shirt') || name.includes('tshirt'))) {
      return subcollectionName;
    }
    if (key === 'sweatshirts' && name.includes('sweatshirt')) {
      return subcollectionName;
    }
    if (key === 'vests' && name.includes('vest')) {
      return subcollectionName;
    }
    if (key === 'bracelets' && name.includes('bracelet')) {
      return subcollectionName;
    }
    if (key === 'belts' && name.includes('belt')) {
      return subcollectionName;
    }
    if (key === 'fanny packs' && name.includes('fanny pack')) {
      return subcollectionName;
    }
    if (key === 'wallets' && name.includes('wallet')) {
      return subcollectionName;
    }
    if (key === 'accessories' && (name.includes('barrette') || name.includes('accessory'))) {
      return subcollectionName;
    }
    if (key === 'bags' && (
      name.includes('bag')
      || name.includes('duffel')
      || name.includes('pack')
      || name.includes('wristlet')
    )) {
      return subcollectionName;
    }
  }

  return null;
};

const migrateLegacySubcollectionFields = async () => {
  const legacyProducts = await Product.find({
    subcollectionIds: { $exists: true },
  }).select('subcollectionIds subCollectionId');

  const migrations = legacyProducts
    .map((product) => {
      const legacyId = Array.isArray(product.subcollectionIds)
        ? product.subcollectionIds.find(Boolean)
        : null;

      if (!legacyId) {
        return Product.updateOne(
          { _id: product._id },
          { $unset: { subcollectionIds: '' } },
        );
      }

      return Product.updateOne(
        { _id: product._id },
        {
          $set: { subCollectionId: legacyId },
          $unset: { subcollectionIds: '' },
        },
      );
    });

  if (!migrations.length) {
    return;
  }

  await Promise.all(migrations);
  console.log(`ℹ️ Migrated legacy subcollection fields for ${migrations.length} products.`);
};

const backfillProductSubcollectionIds = async () => {
  const subcollections = await Subcollection.find().lean();
  if (!subcollections.length) {
    return;
  }

  const subcollectionsByCollectionId = subcollections.reduce((groups, subcollection) => {
    const collectionId = String(subcollection.collectionId);
    if (!groups[collectionId]) {
      groups[collectionId] = [];
    }
    groups[collectionId].push(subcollection);
    return groups;
  }, {});

  const products = await Product.find().select('name collectionId subCollectionId');

  const updates = [];

  for (const product of products) {
    const collectionSubcollections = subcollectionsByCollectionId[String(product.collectionId)] || [];
    if (!collectionSubcollections.length) {
      continue;
    }

    const subcollectionNames = collectionSubcollections.map((item) => item.name);
    const inferredName = inferSubcollectionName(product.name, subcollectionNames);
    if (!inferredName) {
      continue;
    }

    const subcollection = collectionSubcollections.find(
      (item) => item.name.toLowerCase() === inferredName.toLowerCase(),
    );
    if (!subcollection) {
      continue;
    }

    if (String(product.subCollectionId || '') === String(subcollection._id)) {
      continue;
    }

    updates.push(Product.updateOne(
      { _id: product._id },
      { $set: { subCollectionId: subcollection._id } },
    ));
  }

  if (!updates.length) {
    return;
  }

  await Promise.all(updates);
  console.log(`ℹ️ Backfilled subCollectionId for ${updates.length} products.`);
};

const repairLegacyProductIndex = async () => {
  await Product.updateMany({ legacyId: null }, { $unset: { legacyId: '' } });

  const indexes = await Product.collection.indexes();
  const legacyIndex = indexes.find((index) => index.name === 'legacyId_1');
  const hasCorrectFilter = legacyIndex?.partialFilterExpression?.legacyId?.$type === 'number';

  if (legacyIndex && !hasCorrectFilter) {
    await Product.collection.dropIndex('legacyId_1');
  }

  if (!legacyIndex || !hasCorrectFilter) {
    await Product.collection.createIndex(
      { legacyId: 1 },
      {
        name: 'legacyId_1',
        unique: true,
        partialFilterExpression: { legacyId: { $type: 'number' } },
      },
    );
    console.log('ℹ️ Repaired the legacy product ID index for dashboard-created items.');
  }
};

const backfillProductQuantities = async () => {
  const result = await Product.updateMany(
    { quantity: { $exists: false } },
    { $set: { quantity: 1 } },
  );
  if (result.modifiedCount) {
    console.log(`ℹ️ Initialized inventory quantity to 1 for ${result.modifiedCount} products.`);
  }
  await Product.updateMany(
    { quantity: 0, outOfStock: { $ne: true } },
    { $set: { outOfStock: true } },
  );
};

const formatMongoConnectionError = (error) => {
  const message = String(error?.message || error);
  const hostname = (() => {
    try {
      const uri = config.mongoUri.replace(/^mongodb\+srv:/, 'https:').replace(/^mongodb:/, 'https:');
      return new URL(uri).hostname;
    } catch {
      return '';
    }
  })();

  if (error?.code === 'ENOTFOUND' || message.includes('querySrv')) {
    return new Error(
      [
        'Could not resolve the MongoDB host in MONGODB_URI.',
        hostname ? `Host: ${hostname}` : '',
        'Copy the latest Public network connection string from DigitalOcean → Databases → your cluster → Connection details.',
        'Also confirm the cluster is Online, your IP is allowed under Network Access, and VPN/DNS is not blocking mongo.ondigitalocean.com.',
      ].filter(Boolean).join(' '),
      { cause: error },
    );
  }

  if (message.includes('Authentication failed') || message.includes('auth failed')) {
    return new Error(
      'MongoDB authentication failed. Verify the username, password, and authSource=admin in MONGODB_URI.',
      { cause: error },
    );
  }

  return error;
};

export const connectDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    throw formatMongoConnectionError(error);
  }

  const connectedDb = mongoose.connection.name || '(unknown)';
  const connectedHost = mongoose.connection.host || '(unknown)';
  console.log(`✅ MongoDB connected (host=${connectedHost}, db=${connectedDb})`);

  const uncategorized = await Collection.findOne({ isSystem: true, slug: 'uncategorized' });
  if (!uncategorized) {
    await Collection.create({
      name: 'Uncategorized',
      slug: 'uncategorized',
      sortOrder: Number.MAX_SAFE_INTEGER,
      isSystem: true,
    });
    console.log('ℹ️ Created system Uncategorized collection');
  }

  await migrateLegacySubcollectionFields();
  await repairLegacyProductIndex();
  await backfillProductQuantities();
  await renameNaturalWhiteColors();
  await backfillNoBlingDescriptions();
  await ensureMyraBeltsSubcollection();
  await backfillProductSubcollectionIds();
};
