import mongoose from 'mongoose';
import { config, getMongoDatabaseName, maskMongoUri } from './index.js';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Subcollection } from '../models/Subcollection.js';
import { slugify } from '../utils/slug.js';
import { defaultShirtSizes, sortSizeOptions } from '../utils/sizeOptions.js';
import {
  extractBeltSizes,
  extractClothingSizes,
  extractShoeSizes,
  extractSweaterSizes,
} from '../utils/descriptionSizes.js';
import { isSweatshirtProduct, isTShirtProduct } from '../utils/productSizeType.js';
import { seedCatalog } from '../services/catalogSeed.js';
import { Order } from '../models/Order.js';

const removeDuplicateProductSizes = async () => {
  const products = await Product.find({
    $or: [
      { size: /,/ },
      { sweatshirtSize: /,/ },
      { shoeSize: /,/ },
      { beltSize: /,/ },
    ],
  });
  let updated = 0;

  const uniqueList = (value) => [...new Map(String(value || '')
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean)
    .map((option) => [option.toLowerCase(), option])).values()];

  for (const product of products) {
    const size = sortSizeOptions(String(product.size || '').split(',')).join(', ');
    const sweatshirtSize = sortSizeOptions(String(product.sweatshirtSize || '').split(',')).join(', ');
    const shoeSize = uniqueList(product.shoeSize).join(', ');
    const beltSize = uniqueList(product.beltSize).join(', ');
    if (size === product.size && sweatshirtSize === product.sweatshirtSize && shoeSize === product.shoeSize && beltSize === product.beltSize) continue;
    product.size = size;
    product.sweatshirtSize = sweatshirtSize;
    product.shoeSize = shoeSize;
    product.beltSize = beltSize;
    await product.save();
    updated += 1;
  }

  if (updated) console.log(`ℹ️ Removed duplicate size options from ${updated} product(s).`);
};

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
      { comfortColors: legacyLabel },
      { 'customProperties.options': legacyLabel },
    ],
  });

  for (const product of products) {
    product.color = [...new Set(String(product.color || '')
      .split(',')
      .map((color) => legacyLabel.test(color.trim()) ? 'Natural White' : color.trim())
      .filter(Boolean))]
      .join(', ');
    product.comfortColors = [...new Set((product.comfortColors || []).map(
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

const hasPartialGtEmpty = (index, field) => (
  index?.unique === true
  && index?.partialFilterExpression?.[field]?.$gt === ''
);

const repairPaypalOrderIdIndex = async () => {
  const unsetPaypal = await Order.updateMany(
    { $or: [{ paypalOrderId: '' }, { paypalOrderId: null }] },
    { $unset: { paypalOrderId: 1 } },
  );
  const unsetGateway = await Order.updateMany(
    { $or: [{ gatewayOrderId: '' }, { gatewayOrderId: null }] },
    { $unset: { gatewayOrderId: 1 } },
  );
  const cleared = Number(unsetPaypal.modifiedCount || 0) + Number(unsetGateway.modifiedCount || 0);
  if (cleared) {
    console.log(`ℹ️ Cleared empty PayPal/Clover payment IDs from ${cleared} order(s) so unique indexes ignore Clover records.`);
  }

  const indexes = await Order.collection.indexes();
  const paypalIndex = indexes.find((index) => index.name === 'paypalOrderId_1');
  if (paypalIndex && !hasPartialGtEmpty(paypalIndex, 'paypalOrderId')) {
    await Order.collection.dropIndex('paypalOrderId_1');
    console.log('ℹ️ Dropped obsolete unique paypalOrderId_1 index that blocked Clover orders with empty PayPal IDs.');
  }

  if (!paypalIndex || !hasPartialGtEmpty(paypalIndex, 'paypalOrderId')) {
    await Order.collection.createIndex(
      { paypalOrderId: 1 },
      {
        name: 'paypalOrderId_1',
        unique: true,
        partialFilterExpression: { paypalOrderId: { $type: 'string', $gt: '' } },
      },
    );
    console.log('ℹ️ Recreated paypalOrderId_1 as a unique index for historical PayPal IDs only.');
  }

  const gatewayIndex = indexes.find((index) => index.name === 'gatewayOrderId_1');
  if (gatewayIndex && !hasPartialGtEmpty(gatewayIndex, 'gatewayOrderId')) {
    await Order.collection.dropIndex('gatewayOrderId_1');
  }
  if (!gatewayIndex || !hasPartialGtEmpty(gatewayIndex, 'gatewayOrderId')) {
    await Order.collection.createIndex(
      { gatewayOrderId: 1 },
      {
        name: 'gatewayOrderId_1',
        unique: true,
        partialFilterExpression: { gatewayOrderId: { $type: 'string', $gt: '' } },
      },
    );
  }
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

const backfillProductSizes = async () => {
  const products = await Product.find({
    $or: [
      { size: { $exists: false } }, { size: '' },
      { sweatshirtSize: { $exists: false } }, { sweatshirtSize: '' },
      { shoeSize: { $exists: false } }, { shoeSize: '' },
      { beltSize: { $exists: false } }, { beltSize: '' },
    ],
  })
    .populate('collectionId', 'name slug')
    .populate('subCollectionId', 'name slug')
    .select('name description meta filters size sweatshirtSize shoeSize beltSize collectionId subCollectionId');

  let updated = 0;
  for (const product of products) {
    const productType = [
      product.name,
      ...(product.filters || []),
      product.collectionId?.name,
      product.collectionId?.slug,
      product.subCollectionId?.name,
      product.subCollectionId?.slug,
    ].filter(Boolean).join(' ');
    const source = [product.description, ...(product.meta || [])];
    const isSweatshirt = isSweatshirtProduct(product);
    const isTShirt = isTShirtProduct(product);
    let field = '';
    let sizes = [];
    let migratedLegacySizes = false;

    // The original `size` field remains the shared shirt-size fallback. Once an
    // item's type is known, move legacy values into the appropriate dedicated
    // field so the storefront does not render duplicate selectors.
    if (isSweatshirt && String(product.size || '').trim()) {
      if (!String(product.sweatshirtSize || '').trim()) product.sweatshirtSize = product.size;
      product.size = '';
      migratedLegacySizes = true;
    } else if (isTShirt && !String(product.size || '').trim() && String(product.sweatshirtSize || '').trim()) {
      product.size = product.sweatshirtSize;
      product.sweatshirtSize = '';
      migratedLegacySizes = true;
    }

    if (isSweatshirt && !String(product.sweatshirtSize || '').trim()) {
      field = 'sweatshirtSize';
      sizes = extractSweaterSizes(source);
      if (!sizes.length) {
        sizes = sortSizeOptions(String(product.size || '').split(',').map((size) => size.trim()).filter(Boolean));
      }
    } else if (/\b(?:shoe|shoes|heel|heels|boot|boots|sandal|sandals|footwear)\b/i.test(productType) && !String(product.shoeSize || '').trim()) {
      field = 'shoeSize';
      sizes = extractShoeSizes(source);
    } else if (/\bbelts?\b/i.test(productType) && !String(product.beltSize || '').trim()) {
      field = 'beltSize';
      sizes = extractBeltSizes(source);
    } else if (/\b(?:shirts?|t[ -]?shirts?|tops?|jackets?|jeans?|pants?|leggings?|shorts?|skirts?|dresses?|vests?|clothing|apparel)\b/i.test(productType) && !String(product.size || '').trim()) {
      field = 'size';
      sizes = extractClothingSizes(source);
    }

    if (sizes.length) product[field] = sizes.join(', ');
    if (!sizes.length && !migratedLegacySizes && (isSweatshirt || isTShirt)
      && !String(product.size || '').trim() && !String(product.sweatshirtSize || '').trim()) {
      product.size = defaultShirtSizes.join(', ');
      migratedLegacySizes = true;
    }
    if (!sizes.length && !migratedLegacySizes) continue;
    await product.save();
    updated += 1;
  }

  if (updated) console.log(`ℹ️ Backfilled and routed size dropdowns for ${updated} product(s) without changing descriptions.`);
};

const ensureCatalogSeeded = async () => {
  const [collectionCount, productCount] = await Promise.all([
    Collection.countDocuments({ isSystem: false }),
    Product.countDocuments(),
  ]);

  if (collectionCount > 0 || productCount > 0) {
    console.log(`ℹ️ Catalog data already present (${collectionCount} collections, ${productCount} products); skipping seed.`);
    return;
  }

  await seedCatalog();
  console.log('ℹ️ Seeded storefront catalog data from the project data files.');
};

const ensureUncategorizedCollection = async () => {
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
};

const runTimedMaintenanceStep = async (label, task) => {
  const startedAt = Date.now();
  await task();
  const elapsed = Date.now() - startedAt;
  console.log(`ℹ️ Mongo maintenance step "${label}" completed in ${elapsed}ms.`);
};

export const runDatabaseMaintenance = async () => {
  const startedAt = Date.now();
  await runTimedMaintenanceStep('migrateLegacySubcollectionFields', migrateLegacySubcollectionFields);
  await runTimedMaintenanceStep('repairPaypalOrderIdIndex', repairPaypalOrderIdIndex);
  await runTimedMaintenanceStep('repairLegacyProductIndex', repairLegacyProductIndex);
  await runTimedMaintenanceStep('backfillProductQuantities', backfillProductQuantities);
  await runTimedMaintenanceStep('removeDuplicateProductSizes', removeDuplicateProductSizes);
  await runTimedMaintenanceStep('backfillProductSizes', backfillProductSizes);
  await runTimedMaintenanceStep('renameNaturalWhiteColors', renameNaturalWhiteColors);
  await runTimedMaintenanceStep('backfillNoBlingDescriptions', backfillNoBlingDescriptions);
  await runTimedMaintenanceStep('ensureMyraBeltsSubcollection', ensureMyraBeltsSubcollection);
  await runTimedMaintenanceStep('backfillProductSubcollectionIds', backfillProductSubcollectionIds);
  await runTimedMaintenanceStep('ensureCatalogSeeded', ensureCatalogSeeded);
  console.log(`ℹ️ Mongo maintenance finished in ${Date.now() - startedAt}ms.`);
};

export const MONGO_CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
};

let shutdownRequested = false;
let connectionListenersBound = false;

const bindConnectionListeners = () => {
  if (connectionListenersBound) return;
  connectionListenersBound = true;

  mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    if (!shutdownRequested) {
      console.warn('⚠️ MongoDB disconnected');
    }
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });
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

export const disconnectDatabase = async () => {
  shutdownRequested = true;
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
  console.log('ℹ️ MongoDB disconnected');
};

export const connectDatabase = async () => {
  const startedAt = Date.now();
  shutdownRequested = false;
  bindConnectionListeners();

  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(config.mongoUri, MONGO_CONNECT_OPTIONS);
    } catch (error) {
      throw formatMongoConnectionError(error);
    }
  }

  const connectedDb = mongoose.connection.name || '(unknown)';
  const connectedHost = mongoose.connection.host || '(unknown)';
  console.log(`✅ MongoDB connected (host=${connectedHost}, db=${connectedDb})`);

  const uriDbName = getMongoDatabaseName(config.mongoUri);
  if (uriDbName === 'admin') {
    console.warn(
      '⚠️ MONGODB_URI path is /admin (auth database). Application collections will live there unless the path is /pineneedledesigns. authSource=admin should stay in the query string.',
    );
  }
  if (config.isProduction && maskMongoUri(config.mongoUri).includes('127.0.0.1')) {
    throw new Error('Production must not connect to local MongoDB.');
  }

  await ensureUncategorizedCollection();
  await ensureCatalogSeeded();
  console.log(`ℹ️ MongoDB startup checks finished in ${Date.now() - startedAt}ms.`);
};
