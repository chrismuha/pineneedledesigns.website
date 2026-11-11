import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
let initialized = false;
let clearanceInitialized = false;
let holidayInitialized = false;
const calls = [];
const placements = new Map();
mock.module('../backend/src/models/Collection.js', { namedExports: { Collection: {
  findOneAndUpdate: async (...args) => { calls.push(['collection', ...args]); return { _id: args[0].slug }; },
} } });
mock.module('../backend/src/models/Subcollection.js', { namedExports: { Subcollection: {
  findOneAndUpdate: async (...args) => { calls.push(['sub', ...args]); return { _id: args[0].slug }; },
} } });
mock.module('../backend/src/models/Product.js', { namedExports: { Product: {
  find: async ({ name }) => [{ _id: name, collectionId: 'shirts' }],
  updateOne: async (filter, update) => { calls.push(['product', filter, update]); placements.set(filter._id, update.$addToSet.additionalCollections); },
} } });
mock.module('../backend/src/models/StoreSettings.js', { namedExports: { StoreSettings: {
  findOne: async () => ({ seasonalAssignmentsInitialized: initialized, clearanceCollectionInitialized: clearanceInitialized, holidayAssignmentsInitialized: holidayInitialized }),
  updateOne: async (_filter, update) => {
    if (update.$set.seasonalAssignmentsInitialized) initialized = true;
    if (update.$set.holidayAssignmentsInitialized) holidayInitialized = true;
    if (update.$set.clearanceCollectionInitialized) clearanceInitialized = true;
  },
} } });
const { ensureSeasonalCatalog, seasonalProductAssignments } = await import('../backend/src/services/seasonalCatalog.js');
test('initial setup creates four seasons and adds reviewed placements without moving original products', async () => {
  await ensureSeasonalCatalog();
  assert.equal(calls.filter(([type]) => type === 'collection').length, 1);
  assert.deepEqual(calls.filter(([type]) => type === 'sub').map(([, filter]) => filter.slug), ['spring','summer','fall','winter']);
  assert.equal(placements.size, seasonalProductAssignments.length);
  assert.deepEqual(placements.get('SNOW DIVA T-shirt'), { collectionId: 'seasonal', subCollectionId: 'winter' });
  assert.deepEqual(placements.get('Boo-Jee Boa'), { collectionId: 'seasonal', subCollectionId: 'fall' });
  for (const [, , update] of calls.filter(([type]) => type === 'product')) assert.deepEqual(Object.keys(update), ['$addToSet']);
});
test('subsequent startups preserve owner changes, including removed assignments and seasons', async () => {
  const before = calls.length;
  placements.delete('SNOW DIVA T-shirt');
  await ensureSeasonalCatalog();
  assert.equal(calls.length, before); assert.equal(placements.has('SNOW DIVA T-shirt'), false);
});

const { ensureClearanceCatalog } = await import('../backend/src/services/clearanceCatalog.js');
test('Clearance is created or reused without changing existing settings, product assignments or prices', async () => {
  const before = calls.length;
  await ensureClearanceCatalog();
  const newCalls = calls.slice(before);
  assert.equal(newCalls.length, 1);
  const [type, filter, update, options] = newCalls[0];
  assert.equal(type, 'collection');
  assert.deepEqual(filter, { slug: 'clearance' });
  assert.deepEqual(Object.keys(update), ['$setOnInsert']);
  assert.equal(update.$setOnInsert.name, 'Clearance');
  assert.equal(update.$setOnInsert.showWhenEmpty, true);
  assert.equal(update.$setOnInsert.isSystem, false);
  assert.equal(options.upsert, true);
  assert.equal(clearanceInitialized, true);
});
test('Clearance initialization is independent of Seasonal and preserves later owner changes', async () => {
  const before = calls.length;
  assert.equal(initialized, true);
  await ensureClearanceCatalog();
  assert.equal(calls.length, before);
});

const { ensureHolidayCatalog, holidays } = await import('../backend/src/services/holidayCatalog.js');
test('Holiday adds named holidays and explicit Halloween designs without replacing other placements', async () => {
  const before = calls.length;
  await ensureHolidayCatalog();
  const added = calls.slice(before);
  const collectionCalls = added.filter(([type]) => type === 'collection');
  assert.equal(collectionCalls.length, 1);
  assert.deepEqual(collectionCalls[0][1], { slug: 'holiday' });
  assert.deepEqual(Object.keys(collectionCalls[0][2]), ['$setOnInsert']);
  assert.equal(collectionCalls[0][2].$setOnInsert.showWhenEmpty, true);
  assert.deepEqual(added.filter(([type]) => type === 'sub').map(([, , update]) => update.$setOnInsert.name), holidays);
  assert.deepEqual(holidays, [...holidays].sort((a, b) => a.localeCompare(b)));
  const productCalls = added.filter(([type]) => type === 'product');
  assert.deepEqual(productCalls.map(([, filter]) => filter._id), ['Boo-Jee Boa', 'Mischief Witch and Her Cat- Blinged Out']);
  for (const [, , update] of productCalls) {
    assert.deepEqual(Object.keys(update), ['$addToSet']);
    assert.deepEqual(update.$addToSet.additionalCollections, { collectionId: 'holiday', subCollectionId: 'halloween' });
  }
  assert.equal(holidayInitialized, true);
});
test('Holiday setup is independent and subsequent startups preserve owner changes', async () => {
  const before = calls.length;
  placements.delete('Boo-Jee Boa');
  await ensureHolidayCatalog();
  assert.equal(calls.length, before);
  assert.equal(placements.has('Boo-Jee Boa'), false);
  assert.equal(initialized, true);
  assert.equal(clearanceInitialized, true);
});
