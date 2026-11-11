import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
const actions = [];
const product = { _id: '507f1f77bcf86cd799439011', name: 'Test product', collectionId: '507f1f77bcf86cd799439012', photos: [], videos: [],
  deleteOne: async () => actions.push('product deleted') };
let assignedProducts = [product];
const membershipUpdates = [];
const deletedIds = [];
const collection = { _id: '507f1f77bcf86cd799439012', name: 'Test collection',
  deleteOne: async () => actions.push('collection deleted') };
const subcollection = { _id: '507f1f77bcf86cd799439013', name: 'Test filter',
  deleteOne: async () => actions.push('subcollection deleted') };
const query = (value) => ({ select: () => ({ lean: async () => value }) });
mock.module('../backend/src/models/Product.js', { namedExports: { Product: {
  findById: async () => product,
  find: (filter) => query(filter.$or ? assignedProducts : []),
  deleteMany: async (filter) => { deletedIds.push(...filter._id.$in); actions.push('products deleted'); },
  updateOne: async (filter, update) => { membershipUpdates.push({filter,update}); actions.push('shared product retained'); },
  updateMany: async () => actions.push('products retained'),
} } });
mock.module('../backend/src/models/Collection.js', { namedExports: { Collection: {
  findById: async () => collection,
} } });
mock.module('../backend/src/models/Subcollection.js', { namedExports: { Subcollection: {
  find: () => query([subcollection]), findOne: async () => subcollection,
  deleteMany: async () => actions.push('subcollections deleted'),
} } });
mock.module('../backend/src/services/storefrontCatalog.js', { namedExports: {
  invalidateStorefrontCatalog: () => {},
} });
mock.module('../backend/src/services/catalogAudit.js', { namedExports: {
  catalogTarget: (kind, record) => ({ key: `${kind}:${record._id}`, name: record.name }),
  auditedRemoval: async (event, action) => { actions.push(event); return action(); },
  removeUploadedMedia: async () => { throw new Error('No media expected'); },
} });
const { deleteProduct } = await import('../backend/src/controllers/productController.js');
const { deleteCollection } = await import('../backend/src/controllers/collectionController.js');
const { deleteSubcollection } = await import('../backend/src/controllers/subcollectionController.js');
const res = { json: (value) => value, status: () => { throw new Error('Unexpected error response'); } };

test('product removal is audited before deletion', async () => {
  actions.length = 0;
  await deleteProduct({ params: { id: product._id } }, res);
  assert.equal(actions[0].targets[0].key, `products:${product._id}`);
  assert.equal(actions[1], 'product deleted');
});
test('collection audit identifies cascading deletions', async () => {
  actions.length = 0;
  await deleteCollection({ params: { id: collection._id }, body: { confirmDelete: true, confirmName: collection.name } }, res);
  assert.deepEqual(actions[0].targets.map((target) => target.key), [
    `collections:${collection._id}`, `products:${product._id}`, `subcollections:${subcollection._id}`,
  ]);
  assert.deepEqual(actions.slice(1), ['products deleted', 'subcollections deleted', 'collection deleted']);
});
test('subcollection audit distinguishes retained products', async () => {
  actions.length = 0;
  await deleteSubcollection({ params: { collectionId: collection._id, subcollectionId: subcollection._id } }, res);
  assert.equal(actions[0].targets[0].key, `subcollections:${subcollection._id}`);
  assert.deepEqual(actions.slice(1), ['subcollection deleted', 'products retained', 'products retained']);
});

test('deleting a collection promotes another placement and preserves shared inventory and media', async () => {
  actions.length = 0; deletedIds.length = 0; membershipUpdates.length = 0;
  const shared = { ...product, _id: '507f1f77bcf86cd799439021', quantity: 6,
    photos: ['/uploads/shared.webp'], additionalCollections: [
      { collectionId: '507f1f77bcf86cd799439022', subCollectionId: '507f1f77bcf86cd799439023' },
      { collectionId: collection._id, subCollectionId: subcollection._id },
    ] };
  const additionalOnly = { ...shared, _id: '507f1f77bcf86cd799439024',
    collectionId: '507f1f77bcf86cd799439022' };
  assignedProducts = [product, shared, additionalOnly];
  let result;
  await deleteCollection({ params: { id: collection._id },
    body: { confirmDelete: true, confirmName: collection.name } }, { ...res, json: (body) => { result = body; } });
  assert.deepEqual(deletedIds, [product._id]);
  assert.equal(result.retainedProducts, 2);
  assert.deepEqual(membershipUpdates[0], { filter: { _id: shared._id }, update: { $set: {
    collectionId: '507f1f77bcf86cd799439022', subCollectionId: '507f1f77bcf86cd799439023', additionalCollections: [],
  } } });
  assert.equal(membershipUpdates[1].update.$set.additionalCollections.length, 1);
  for (const {update} of membershipUpdates) {
    assert.equal('quantity' in update.$set, false); assert.equal('photos' in update.$set, false);
  }
  assert.equal(actions[0].targets.some((target) => target.key === `products:${shared._id}`), false);
  assignedProducts = [product];
});
