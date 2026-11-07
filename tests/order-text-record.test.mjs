import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Order } from '../backend/src/models/Order.js';
import { Product } from '../backend/src/models/Product.js';
import { orderTextRecord } from '../backend/src/utils/orderTextRecord.js';

test('legacy nested snapshots omit media and product links while retaining accounting and payment data', () => {
  const productId = new mongoose.Types.ObjectId();
  const at = new Date('2026-11-06T12:00:00Z');
  const input = {
    inventoryLines: [{ productId, quantity: 2 }],
    items: [{ title: 'Farmer Mrs. Synakowski', quantity: 2, price: 180,
      options: { Size: '2X', Color: 'Coral' },
      images: ['/uploads/farmer-picture.webp'], videos: ['/uploads/farmer-video.webm'],
      product: { name: 'Farmer Mrs. Synakowski', cardImage: '/uploads/cover.webp', url: '/collections/sweaters' },
      extra: { preview: 'https://cdn.example/video.mp4?download=1', encoded: '%2Fuploads%2Fphoto.webp' },
    }],
    summary: { finalTotal: 360 }, createdAt: at,
    pendingChange: { checkoutUrl: 'https://checkout.clover.com/pay/session',
      proposed: { items: [{ title: 'Farmer Mrs. Synakowski', thumbnail: 'data:image/png;base64,AA==' }] } },
  };
  const result = orderTextRecord(input);
  assert.deepEqual(result.items, [{ title: 'Farmer Mrs. Synakowski', quantity: 2, price: 180,
    options: { Size: '2X', Color: 'Coral' }, product: { name: 'Farmer Mrs. Synakowski' }, extra: {} }]);
  assert.equal(result.inventoryLines[0].productId, productId);
  assert.equal(result.createdAt, at);
  assert.deepEqual(result.summary, input.summary);
  assert.equal(result.pendingChange.checkoutUrl, input.pendingChange.checkoutUrl);
  assert.deepEqual(result.pendingChange.proposed.items, [{ title: 'Farmer Mrs. Synakowski' }]);
  assert.equal(input.items[0].images.length, 1, 'reading an old order must not mutate its stored snapshot');
});

test('new order snapshots strip media at assignment, including nested proposed edits', async () => {
  const order = new Order({ items: [{ name: 'Farmer', quantity: 1, image: '/uploads/farmer.webp' }],
    lineItems: [{ title: 'Farmer', subtotal: 180, videoPosters: ['/uploads/poster.webp'] }],
    pendingChange: { proposed: { items: [{ title: 'Farmer', productLink: '/collections/sweaters' }] } },
  });
  await order.validate();
  assert.deepEqual(order.toObject().items, [{ name: 'Farmer', quantity: 1 }]);
  assert.deepEqual(order.toObject().lineItems, [{ title: 'Farmer', subtotal: 180 }]);
  assert.deepEqual(order.toObject().pendingChange.proposed.items, [{ title: 'Farmer' }]);
});

test('legacy hydrated orders serialize without media, without rewriting history', () => {
  const order = Order.hydrate({ _id: new mongoose.Types.ObjectId(),
    items: [{ name: 'Farmer', price: 180, photos: ['/uploads/old.webp'] }],
    pendingChange: { proposed: { lineItems: [{ title: 'Farmer', media: { url: '/uploads/old.webm' } }] } },
  });
  const response = JSON.parse(JSON.stringify({ order }));
  assert.deepEqual(response.order.items, [{ name: 'Farmer', price: 180 }]);
  assert.deepEqual(response.order.pendingChange.proposed.lineItems, [{ title: 'Farmer' }]);
  assert.deepEqual(order.toObject().items[0].photos, ['/uploads/old.webp']);
});

test('order read endpoints filter lean historical records as well as document responses', async (t) => {
  const { listOrders, getOrderById } = await import('../backend/src/controllers/orderController.js');
  const legacy = { orderNumber: 12, items: [{ name: 'Farmer', photos: ['/uploads/old.webp'] }],
    summary: { finalTotal: 180 } };
  t.mock.method(Order, 'find', () => ({ sort: () => ({ lean: async () => [legacy] }) }));
  t.mock.method(Order, 'findById', () => ({ lean: async () => legacy }));
  const res = { json: (value) => value };
  assert.deepEqual(await listOrders({ query: {} }, res), [{ orderNumber: 12,
    items: [{ name: 'Farmer' }], summary: { finalTotal: 180 } }]);
  assert.deepEqual(await getOrderById({ params: { id: 'fixture' } }, res), {
    orderNumber: 12, items: [{ name: 'Farmer' }], summary: { finalTotal: 180 } });
});

test('order editor requests only text, price, and inventory fields from products', async (t) => {
  const { listOrderItemOptions } = await import('../backend/src/controllers/orderController.js');
  let projection;
  t.mock.method(Product, 'find', () => ({ select: (value) => {
    projection = value;
    return { sort: () => ({ lean: async () => [{ _id: 'fixture', name: 'Farmer', price: 180, quantity: 1 }] }) };
  } }));
  const result = await listOrderItemOptions({}, { json: (value) => value });
  assert.deepEqual(projection.split(' ').sort(), ['_id', 'name', 'outOfStock', 'price', 'quantity']);
  assert.equal(result[0].name, 'Farmer');
});
