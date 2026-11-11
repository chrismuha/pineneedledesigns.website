import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
let initialized = false;
const writes = [];
for (const [file, name] of [['Product', 'items'], ['Collection', 'collections'], ['Subcollection', 'sub-collections']]) {
  mock.module(`../backend/src/models/${file}.js`, { namedExports: { [file]: {
    updateMany: async (filter, update) => { writes.push({ name, filter, update }); },
  } } });
}
mock.module('../backend/src/models/StoreSettings.js', { namedExports: { StoreSettings: {
  findOne: async () => ({ websiteVisibilityInitialized: initialized }),
  updateOne: async (_filter, update) => { initialized = update.$set.websiteVisibilityInitialized; },
} } });
const { initializeWebsiteVisibility } = await import('../backend/src/services/websiteVisibility.js');
test('initial rollout enables every existing item, collection and sub-collection', async () => {
  await initializeWebsiteVisibility();
  assert.deepEqual(writes, ['items','collections','sub-collections'].map((name) => ({ name, filter: {}, update: { $set: { hidden: false } } })));
  assert.equal(initialized, true);
});
test('later startups preserve everything the owner has unchecked', async () => {
  await initializeWebsiteVisibility();
  assert.equal(writes.length, 3);
});
