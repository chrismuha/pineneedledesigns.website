import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
const id = (n) => n.toString(16).padStart(24, '0');
const collections = [{ _id: id(1), name: 'Shirts' }, { _id: id(2), name: 'Seasonal' }, { _id: id(3), isSystem: true }];
const subs = [{ _id: id(11), collectionId: id(1) }, { _id: id(21), collectionId: id(2) }, { _id: id(22), collectionId: id(2) }];
let product, saved, created, invalidations = 0;
const reset = () => {
  saved = 0;
  product = { _id: id(31), collectionId: id(1), subCollectionId: id(11), photos: ['/uploads/old.webp'], videos: [], quantity: 6,
    additionalCollections: [{ collectionId: id(2), subCollectionId: id(21) }],
    save: async () => { saved += 1; }, populate: async function () { return this; } };
};
mock.module('../backend/src/models/Collection.js', { namedExports: { Collection: {
  findById: async (value) => collections.find((c) => c._id === String(value)),
} } });
mock.module('../backend/src/models/Subcollection.js', { namedExports: { Subcollection: {
  countDocuments: async (filter) => subs.filter((s) => s.collectionId === String(filter.collectionId)).length,
  findOne: (filter) => ({ select: async () => subs.find((s) => s._id === String(filter._id) && s.collectionId === String(filter.collectionId)) }),
} } });
mock.module('../backend/src/models/Product.js', { namedExports: { Product: {
  findById: async () => product,
  findOne: () => ({ sort: () => ({ select: async () => ({ sortOrder: 0 }) }) }),
  create: async (data) => { created = data; return { ...data, populate: async () => data }; },
} } });
mock.module('../backend/src/services/storefrontCatalog.js', { namedExports: {
  invalidateStorefrontCatalog: () => { invalidations += 1; },
} });
mock.module('../backend/src/services/videoTranscoder.js', { namedExports: { queueVideoTranscode: () => {} } });
const { updateProduct, createProduct } = await import('../backend/src/controllers/productController.js');
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const update = async (body) => { const res = response(); await updateProduct({ params: { id: id(31) }, body }, res); return res; };

test('JSON and multipart assignment lists save once, collapse duplicates, and preserve the primary type', async () => {
  for (const serialize of [(value) => value, JSON.stringify]) {
    reset();
    const res = await update({ additionalCollections: serialize([
      { collectionId: id(1), subCollectionId: id(11) },
      { collectionId: id(2), subCollectionId: id(21) },
      { collectionId: id(2), subCollectionId: id(21) },
      { collectionId: id(2), subCollectionId: id(22) },
    ]) });
    assert.equal(res.statusCode, 200); assert.equal(saved, 1);
    assert.equal(product.collectionId, id(1)); assert.equal(product.subCollectionId, id(11));
    assert.deepEqual(product.additionalCollections, [
      { collectionId: id(2), subCollectionId: id(21) }, { collectionId: id(2), subCollectionId: id(22) },
    ]);
    assert.equal(product.quantity, 6);
  }
});
test('invalid, foreign, deleted and system placements fail without saving or invalidating', async () => {
  for (const additionalCollections of ['{', null, {}, [{ collectionId: { $ne: null } }],
    [{ collectionId: id(99) }], [{ collectionId: id(3) }],
    [{ collectionId: id(2), subCollectionId: id(11) }],
    [{ collectionId: id(2), subCollectionId: id(99) }],
    Array.from({ length: 51 }, () => ({ collectionId: id(2) }))]) {
    reset(); const before = invalidations;
    const res = await update({ additionalCollections });
    assert.equal(res.statusCode, 400); assert.equal(saved, 0); assert.equal(invalidations, before);
  }
});
test('old clients preserve placements; explicit empty lists remove them without changing stock', async () => {
  reset(); await update({ quantity: 4 });
  assert.equal(product.additionalCollections.length, 1);
  await update({ additionalCollections: [] });
  assert.equal(product.additionalCollections.length, 0); assert.equal(product.quantity, 4);
});
test('creating an item accepts multipart placements and validates paired sub-collections', async () => {
  reset();
  const req = { body: { name: 'Snow Diva', description: 'Winter shirt', price: 36,
    collectionId: id(1), subCollectionId: id(11),
    additionalCollections: JSON.stringify([{ collectionId: id(2), subCollectionId: id(21) }]) },
    files: { photos: [{ filename: 'snow-diva-picture-01.webp' }] } };
  const res = response(); await createProduct(req, res);
  assert.equal(res.statusCode, 201); assert.equal(created.additionalCollections.length, 1);
  assert.equal(String(created.collectionId), id(1)); assert.equal(String(created.subCollectionId), id(11));
});

test('item visibility accepts JSON and multipart booleans, restores items and preserves stock and placements', async () => {
  reset();
  for (const hidden of [true, 'true', false, 'false']) {
    const res = await update({ hidden });
    assert.equal(res.statusCode, 200);
    assert.equal(product.hidden, hidden === true || hidden === 'true');
    assert.equal(product.quantity, 6);
    assert.equal(product.additionalCollections.length, 1);
  }
  for (const hidden of [null, 'no', 0, {}, []]) {
    const before = saved;
    assert.equal((await update({ hidden })).statusCode, 400);
    assert.equal(saved, before);
  }
});
