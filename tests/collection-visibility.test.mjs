import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
let saves = 0;
let invalidations = 0;
let subSaves = 0;
const subcollection = { _id: '507f1f77bcf86cd799439013', name: 'T-Shirts', slug: 't-shirts', save: async () => { subSaves += 1; } };
const collection = { _id: '507f1f77bcf86cd799439012', name: 'Shirts', slug: 'shirts',
  save: async () => { saves += 1; } };
mock.module('../backend/src/models/Collection.js', { namedExports: { Collection: { findById: async () => collection } } });
mock.module('../backend/src/services/storefrontCatalog.js', { namedExports: { invalidateStorefrontCatalog: () => { invalidations += 1; } } });
mock.module('../backend/src/models/Subcollection.js', { namedExports: { Subcollection: { findOne: async () => subcollection } } });
const { updateSubcollection } = await import('../backend/src/controllers/subcollectionController.js');
const { updateCollection } = await import('../backend/src/controllers/collectionController.js');
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } });
test('collection checkbox can hide and restore without requiring a rename or changing its URL', async () => {
  for (const hidden of [true, false]) {
    const res = response();
    await updateCollection({ params: { id: collection._id }, body: { hidden } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(collection.hidden, hidden);
    assert.equal(collection.name, 'Shirts');
    assert.equal(collection.slug, 'shirts');
  }
  assert.equal(saves, 2); assert.equal(invalidations, 2);
});
test('invalid visibility updates do not save or silently hide a collection', async () => {
  for (const body of [{ hidden: 'false' }, { hidden: null }, { hidden: 1 }, {}]) {
    const res = response();
    await updateCollection({ params: { id: collection._id }, body }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(saves, 2); assert.equal(invalidations, 2);
});

test('sub-collection checkbox saves without a rename and rejects invalid values', async () => {
  const params = { collectionId: collection._id, subcollectionId: subcollection._id };
  for (const hidden of [true, false]) {
    const res = response();
    await updateSubcollection({ params, body: { hidden } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(subcollection.hidden, hidden);
    assert.equal(subcollection.name, 'T-Shirts');
    assert.equal(subcollection.slug, 't-shirts');
  }
  for (const body of [{ hidden: 'false' }, { hidden: null }, { hidden: {} }, {}]) {
    const res = response();
    await updateSubcollection({ params, body }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(subSaves, 2);
});
