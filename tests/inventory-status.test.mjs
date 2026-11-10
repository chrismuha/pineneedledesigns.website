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
