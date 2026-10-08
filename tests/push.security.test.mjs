import test from 'node:test';
import assert from 'node:assert/strict';
import webpush from 'web-push';
const vapid = webpush.generateVAPIDKeys();
process.env.VAPID_PUBLIC_KEY = vapid.publicKey;
process.env.VAPID_PRIVATE_KEY = vapid.privateKey;
const { subscribeToPush, unsubscribeFromPush } = await import('../backend/src/controllers/pushController.js');
const { PushSubscription } = await import('../backend/src/models/PushSubscription.js');
const response = () => ({ statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } });

test('operator objects cannot become subscription query or update expressions', async (t) => {
  let writes = 0;
  t.mock.method(PushSubscription, 'findOneAndUpdate', async () => { writes += 1; });
  for (const body of [
    { endpoint: { $ne: null }, keys: { p256dh: 'public', auth: 'auth' } },
    { endpoint: 'https://push.example/device', keys: { p256dh: { $ne: null }, auth: 'auth' } },
    { endpoint: 'https://push.example/device', keys: { p256dh: 'public', auth: { $gt: '' } } },
  ]) {
    const res = response();
    await subscribeToPush({ body, get: () => 'test' }, res);
    assert.equal(res.statusCode, 400);
  }
  assert.equal(writes, 0);
});

test('valid subscriptions preserve keys/preferences and discard extra operator fields', async (t) => {
  const endpoint = 'https://push.example/device';
  let query, update;
  t.mock.method(PushSubscription, 'findOneAndUpdate', async (filter, changes) => {
    query = filter; update = changes;
    return { id: 'subscription', preferences: changes.$set.preferences };
  });
  const res = response();
  await subscribeToPush({ body: { endpoint, keys: { p256dh: 'public', auth: 'auth', $where: 'malicious' }, preferences: { orders: false } }, get: () => 'test' }, res);
  assert.equal(res.statusCode, 201);
  assert.deepEqual(query, { endpoint: { $eq: endpoint } });
  assert.deepEqual(update.$set.keys, { p256dh: 'public', auth: 'auth' });
  assert.deepEqual(res.body.preferences, { orders: false, bookings: true });
  let removed;
  t.mock.method(PushSubscription, 'deleteOne', async (filter) => { removed = filter; });
  await unsubscribeFromPush({ body: { endpoint } }, response());
  assert.deepEqual(removed, { endpoint: { $eq: endpoint } });
});
