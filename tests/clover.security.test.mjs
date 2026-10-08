import test from 'node:test';
import assert from 'node:assert/strict';
const { cloverConfig } = await import('../backend/src/config/clover.js');
const { verifyCloverHostedCheckoutAuth } = await import('../backend/src/services/cloverService.js');

test('production-host text in a merchant path does not change sandbox mode', async (t) => {
  Object.assign(cloverConfig, { accessToken: 'test-token', merchantId: 'api.clover.com-account', isProduction: false, environment: 'sandbox' });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url) => { calls.push(url); return { ok: true }; });
  assert.equal(await verifyCloverHostedCheckoutAuth(), true);
  assert.equal(new URL(calls[0]).hostname, 'apisandbox.dev.clover.com');
  assert.equal(cloverConfig.isProduction, false);
  assert.equal(cloverConfig.environment, 'sandbox');
});

test('a successful real production fallback still detects production credentials', async (t) => {
  Object.assign(cloverConfig, { accessToken: 'test-token', merchantId: 'merchant', isProduction: false, environment: 'sandbox' });
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async (url) => ({ ok: new URL(url).hostname === 'api.clover.com' }));
  assert.equal(await verifyCloverHostedCheckoutAuth(), true);
  assert.equal(cloverConfig.environment, 'production');
  assert.equal(cloverConfig.ecommerceApiUrl, 'https://api.clover.com');
});
