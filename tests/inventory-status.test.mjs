import test from 'node:test';
import assert from 'node:assert/strict';
import { Product } from '../backend/src/models/Product.js';

test('saving inventory derives sold status from quantity even when the client sends a stale flag', async () => {
  for (const [quantity, submitted, expected] of [[6, true, false], [0, false, true], [1, true, false]]) {
    const product = new Product({ name: 'Inventory fixture', description: 'Test', price: 1,
      collectionId: '6a4ffc76f950512905f2313e', quantity, outOfStock: submitted });
    await product.validate();
    assert.equal(product.outOfStock, expected);
  }
});

test('new items, collections and sub-collections default to shown on the website', async () => {
  const { Collection } = await import('../backend/src/models/Collection.js');
  const { Subcollection } = await import('../backend/src/models/Subcollection.js');
  const base = { name: 'Default fixture', collectionId: '6a4ffc76f950512905f2313e', slug: 'default-fixture' };
  for (const entry of [new Product({ ...base, description: 'Test', price: 1 }), new Collection(base), new Subcollection(base)]) {
    assert.equal(entry.hidden, false);
    await entry.validate();
    entry.hidden = true;
    await entry.validate();
    assert.equal(entry.hidden, true);
  }
});
