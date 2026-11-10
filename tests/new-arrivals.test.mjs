import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { selectNewArrivals, normalizeNewArrivalsSettings } from '../frontend/src/utils/newArrivals.js';

const id = (number) => number.toString(16).padStart(24, '0');
const products = Array.from({ length: 15 }, (_, index) => ({
  catalogId: id(index + 1), id: index + 100, title: `Product ${index + 1}`,
  images: ['/uploads/test.webp'], createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
  availableQuantity: 1,
}));
const pages = [{ title: 'Test', path: '/collections/test', products }];
const config = (mode, latestCount, customCount, picks = []) => ({
  enabled: true, mode, latestCount, customCount, productIds: picks.map(id),
});

test('existing stores default to the ten newest products across collections', () => {
  assert.deepEqual(selectNewArrivals(pages).map((product) => product.catalogId),
    [15,14,13,12,11,10,9,8,7,6].map(id));
  assert.equal(normalizeNewArrivalsSettings().mode, 'automatic');
});
test('five latest plus four custom reserves both sets and avoids duplicate products', () => {
  const result = selectNewArrivals(pages, config('mixed',5,4,[15,2,3,1]));
  assert.deepEqual(result.map((product) => product.catalogId), [14,13,12,11,10,15,2,3,1].map(id));
  assert.equal(new Set(result.map((product) => product.catalogId)).size,9);
  assert.equal(result.at(-1).path, '/collections/test#product-100');
});
test('each mode can show a single item, including either side of a mixed selection', () => {
  for (const value of [config('automatic',1,0),config('mixed',1,0),config('mixed',0,1,[2]),config('manual',0,1,[2])]) {
    assert.equal(selectNewArrivals(pages,value).length,1);
  }
});
test('sold, photo-less, hidden and deleted picks do not appear or fill custom spaces', () => {
  const altered = [{ ...pages[0], products: products.map((product,index) => ({
    ...product, sold: index === 0, images: index === 1 ? [] : product.images,
  })) }, { title: 'Hidden', path:'/collections/hidden',hidden:true,products:[{...products[0],catalogId:id(99)}] }];
  assert.equal(selectNewArrivals(altered, config('manual',0,4,[1,2,99,98])).length,0);
  assert.equal(selectNewArrivals(pages, config('mixed',5,4,[1])).length,6);
  assert.equal(selectNewArrivals(pages, {...config('automatic',10,0),enabled:false}).length,0);
});

const writes = [];
let invalidations = 0;
mock.module('../backend/src/models/StoreSettings.js', { namedExports: { StoreSettings: {
  findOneAndUpdate: (filter, update, options) => {
    writes.push({filter,update,options});
    return { lean: async () => ({newArrivals:update.$set.newArrivals}) };
  },
} } });
mock.module('../backend/src/services/storefrontCatalog.js', { namedExports: {
  invalidateStorefrontCatalog: () => { invalidations += 1; },
} });
const { updateNewArrivalsSettings } = await import('../backend/src/controllers/settingsController.js');
const response = () => ({statusCode:200,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}});

test('saved New Arrivals settings persist independently and refresh the storefront', async () => {
  const res=response();
  await updateNewArrivalsSettings({body:config('mixed',5,4,[15,2,3,1])},res);
  assert.equal(res.statusCode,200);
  assert.deepEqual(Object.keys(writes.at(-1).update.$set),['newArrivals']);
  assert.equal(writes.at(-1).options.runValidators,true);
  assert.equal(invalidations,1);
  assert.equal(res.body.customCount,4);
});
test('API rejects over-ten totals, zero totals, fractional counts, wrong modes and invalid IDs without saving', async () => {
  const count=writes.length;
  for (const body of [config('mixed',5,6),config('manual',0,0),config('automatic',1.5,0),
    config('automatic',1,1),config('manual',1,1),config('all',1,0),
    {...config('manual',0,1),productIds:[{$ne:null}]},config('manual',0,1,[1,2]),
    {...config('automatic',10,0),enabled:'true'},null]) {
    const res=response();
    await updateNewArrivalsSettings({body},res);
    assert.equal(res.statusCode,400);
  }
  assert.equal(writes.length,count);
});
