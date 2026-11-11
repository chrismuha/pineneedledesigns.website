import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import { productMemberships, membershipQuery } from '../backend/src/utils/collectionMemberships.js';
import { selectNewArrivals, newArrivalsCandidates } from '../frontend/src/utils/newArrivals.js';

const id = (n) => new Types.ObjectId(n.toString(16).padStart(24, '0'));
const collections = [
  { _id: id(1), name: 'Shirts', slug: 'shirts' },
  { _id: id(2), name: 'Seasonal', slug: 'seasonal' },
];
const subs = [
  { _id: id(11), collectionId: id(1), name: 'T-Shirts' },
  { _id: id(12), collectionId: id(1), name: 'Boa' },
  { _id: id(21), collectionId: id(2), name: 'Winter' },
  { _id: id(22), collectionId: id(2), name: 'Fall' },
];
const fixture = { _id: id(31), name: 'Snow Diva', collectionId: id(1), subCollectionId: id(11),
  photos: ['/uploads/snow.webp'], price: 36, quantity: 6, hasBlingOptions: true,
  blingPrice: 36, noBlingPrice: 28, size: 'S, M', description: 'Winter design',
  additionalCollections: [{ collectionId: id(2), subCollectionId: id(21) }], createdAt: '2026-11-10' };
const products = [fixture, { ...fixture, _id: id(32), name: 'Fall Boa', subCollectionId: id(12),
  additionalCollections: [{ collectionId: id(2), subCollectionId: id(22) }] }];
// Fixture evaluator enforces Mongo's same-element semantics for paired placements.
const equals = (a, b) => String(a) === String(b);
const matches = (record, filter) => Object.entries(filter).every(([key, value]) => {
  if (key === '$or') return value.some((part) => matches(record, part));
  if (value?.$elemMatch) return (record[key] || []).some((entry) => matches(entry, value.$elemMatch));
  if (value && '$ne' in Object(value)) return !equals(record[key], value.$ne);
  if (value?.$in) return value.$in.some((item) => equals(record[key], item));
  if (value instanceof RegExp) return value.test(record[key]);
  return equals(record[key], value);
});
const query = (value) => ({ select() { return this; }, sort() { return this; },
  collation() { return this; }, populate() { return this; }, lean: async () => value });
mock.module('../backend/src/models/Collection.js', { namedExports: { Collection: {
  find: () => query(collections), findOne: (filter) => query(collections.find((c) => c.slug === filter.slug) || null),
} } });
mock.module('../backend/src/models/Subcollection.js', { namedExports: { Subcollection: {
  find: (filter = {}) => query(subs.filter((sub) => matches(sub, filter))), findOne: (filter) => query(subs.find((s) => matches(s, filter)) || null),
} } });
mock.module('../backend/src/models/Product.js', { namedExports: { Product: {
  find: (filter = {}) => query(products.filter((p) => matches(p, filter)).map((p) => ({ ...p,
    collectionId: collections.find((c) => equals(c._id, p.collectionId)),
    subCollectionId: subs.find((s) => equals(s._id, p.subCollectionId)),
  }))),
} } });
mock.module('../backend/src/models/StoreSettings.js', { namedExports: { StoreSettings: {
  findOne: () => query({}),
} } });
const { getStorefrontCatalog, getStorefrontProductsBySlug, getStorefrontCollectionBySlug, getStorefrontSubcollectionsBySlug, invalidateStorefrontCatalog } = await import('../backend/src/services/storefrontCatalog.js');

test('legacy primary assignment stays intact; duplicate placements are collapsed', () => {
  assert.equal(productMemberships({ ...fixture, additionalCollections: [] }).length, 1);
  assert.equal(productMemberships({ ...fixture, additionalCollections: [
    ...fixture.additionalCollections, ...fixture.additionalCollections,
    { collectionId: fixture.collectionId, subCollectionId: fixture.subCollectionId },
  ] }).length, 2);
});
test('paired membership queries cannot match a sub-collection from a different placement', () => {
  assert.equal(matches(fixture, membershipQuery(id(2), [id(21)])), true);
  assert.equal(matches(fixture, membershipQuery(id(2), [id(11)])), false);
  assert.equal(matches(fixture, membershipQuery(id(1), [id(21)])), false);
});
test('Snow Diva appears under both Shirts/T-Shirts and Seasonal/Winter, with identical purchase options', async () => {
  const shirts = await getStorefrontProductsBySlug('shirts', String(id(11)));
  const winter = await getStorefrontProductsBySlug('seasonal', String(id(21)));
  assert.equal(shirts.length, 2); // T-Shirts includes Boa.
  assert.deepEqual(winter.map((p) => p.title), ['Snow Diva']);
  assert.deepEqual(winter[0], shirts.find((p) => p.title === 'Snow Diva'));
  assert.equal(winter[0].hasBlingOptions, true);
  assert.equal(winter[0].options.find((o) => o.name === 'Shirt Size').values.length, 2);
  assert.equal(winter[0].availableQuantity, 6);
  const fall = await getStorefrontProductsBySlug('seasonal', String(id(22)));
  assert.deepEqual(fall.map((p) => p.title), ['Fall Boa']);
  assert.equal((await getStorefrontProductsBySlug('seasonal', String(id(11)))).length, 0);
  assert.equal((await getStorefrontProductsBySlug('seasonal', 'invalid')).length, 0);
  assert.deepEqual((await getStorefrontProductsBySlug('shirts', String(id(12)))).map((p) => p.title), ['Fall Boa']);
});
test('full catalog has one listing per collection and unique New Arrivals', async () => {
  const catalog = await getStorefrontCatalog();
  assert.deepEqual(catalog.collectionPages.map((p) => p.count), [2, 2]);
  const seasonal = catalog.collectionPages.find((p) => p.slug === 'seasonal');
  assert.ok(seasonal.products.find((p) => p.title === 'Snow Diva').filters.includes('Winter'));
  const arrivals = selectNewArrivals(catalog.collectionPages);
  assert.equal(arrivals.length, 2);
  assert.equal(newArrivalsCandidates(catalog.collectionPages).length, 2);
});

const { listProductsGrouped } = await import('../backend/src/controllers/productController.js');
test('dashboard groups and filters by the current placement while edits retain the primary assignment', async () => {
  let groups;
  await listProductsGrouped({}, { json: (value) => { groups = value; } });
  assert.deepEqual(groups.map((group) => group.products.length), [2, 2]);
  const seasonal = groups.find((group) => group.slug === 'seasonal');
  const snow = seasonal.products.find((p) => p.name === 'Snow Diva');
  assert.deepEqual(snow.displayedSubcollections.map((sub) => sub.name), ['Winter']);
  assert.equal(String(snow.collectionId._id), String(id(1)));
  assert.equal(String(snow.subCollectionId._id), String(id(11)));
  assert.equal(snow.additionalCollections.length, 1);
});

test('hidden items disappear from all storefront placements and New Arrivals but remain in dashboard groups', async () => {
  fixture.hidden = true;
  invalidateStorefrontCatalog('visibility test');
  try {
    const catalog = await getStorefrontCatalog();
    assert.equal(catalog.collectionPages.some((p) => p.products.some((item) => item.title === 'Snow Diva')), false);
    assert.equal(selectNewArrivals(catalog.collectionPages).some((item) => item.title === 'Snow Diva'), false);
    assert.equal((await getStorefrontProductsBySlug('shirts', String(id(11)))).some((item) => item.title === 'Snow Diva'), false);
    assert.equal((await getStorefrontProductsBySlug('seasonal', String(id(21)))).length, 0);
    let groups;
    await listProductsGrouped({}, { json: (value) => { groups = value; } });
    assert.equal(groups.find((group) => group.slug === 'shirts').products.find((p) => p.name === 'Snow Diva').hidden, true);
  } finally { delete fixture.hidden; invalidateStorefrontCatalog('restore visibility fixture'); }
});
test('hidden collections disappear from navigation and direct endpoints; shared products stay visible elsewhere', async () => {
  collections[0].hidden = true;
  invalidateStorefrontCatalog('collection visibility test');
  try {
    const catalog = await getStorefrontCatalog();
    assert.deepEqual(catalog.collectionPages.map((p) => p.slug), ['seasonal']);
    assert.equal(catalog.navLinks.some((link) => link.slug === 'shirts'), false);
    assert.equal(await getStorefrontCollectionBySlug('shirts'), null);
    assert.equal(await getStorefrontSubcollectionsBySlug('shirts'), null);
    assert.equal(await getStorefrontProductsBySlug('shirts'), null);
    const winter = await getStorefrontProductsBySlug('seasonal', String(id(21)));
    assert.equal(winter[0].title, 'Snow Diva');
    assert.equal(winter[0].hasBlingOptions, true);
    assert.equal(selectNewArrivals(catalog.collectionPages).some((p) => p.title === 'Snow Diva'), true);
  } finally { delete collections[0].hidden; invalidateStorefrontCatalog('restore collection fixture'); }
  assert.equal((await getStorefrontProductsBySlug('shirts')).length, 2);
});

test('hidden sub-collections hide their placements from All, filtered lists and New Arrivals', async () => {
  subs[0].hidden = true; // T-Shirts
  subs[2].hidden = true; // Winter
  invalidateStorefrontCatalog('sub-collection visibility');
  try {
    const catalog = await getStorefrontCatalog();
    const shirts = catalog.collectionPages.find((p) => p.slug === 'shirts');
    assert.deepEqual(shirts.products.map((p) => p.title), ['Fall Boa']);
    assert.equal(shirts.filters.includes('T-Shirts'), false);
    assert.equal(selectNewArrivals(catalog.collectionPages).some((p) => p.title === 'Snow Diva'), false);
    assert.equal((await getStorefrontProductsBySlug('shirts')).some((p) => p.title === 'Snow Diva'), false);
    assert.deepEqual(await getStorefrontProductsBySlug('shirts', String(id(11))), []);
    assert.deepEqual(await getStorefrontProductsBySlug('seasonal', String(id(21))), []);
    assert.equal((await getStorefrontSubcollectionsBySlug('shirts')).some((sub) => String(sub._id) === String(id(11))), false);
    let groups;
    await listProductsGrouped({}, { json: (value) => { groups = value; } });
    assert.equal(groups.find((g) => g.slug === 'shirts').products.some((p) => p.name === 'Snow Diva'), true);
  } finally {
    delete subs[0].hidden; delete subs[2].hidden;
    invalidateStorefrontCatalog('restore sub-collections');
  }
  assert.equal((await getStorefrontProductsBySlug('shirts', String(id(11)))).length, 2);
});
test('hiding one sub-collection preserves other placements and does not leak into broader filters', async () => {
  subs[1].hidden = true; // Boa
  products[1].additionalCollections.push({ collectionId: id(1), subCollectionId: id(11) });
  invalidateStorefrontCatalog('shared sub-collection test');
  try {
    // Explicit T-Shirts placement is still visible even though Boa is hidden.
    assert.equal((await getStorefrontProductsBySlug('shirts', String(id(11)))).length, 2);
    products[1].additionalCollections.pop();
    assert.deepEqual((await getStorefrontProductsBySlug('shirts', String(id(11)))).map((p) => p.title), ['Snow Diva']);
    assert.deepEqual(await getStorefrontProductsBySlug('shirts', String(id(12))), []);
    assert.equal((await getStorefrontProductsBySlug('seasonal', String(id(22)))).length, 1);
  } finally {
    delete subs[1].hidden;
    invalidateStorefrontCatalog('restore Boa visibility');
  }
});
