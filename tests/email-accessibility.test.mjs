import test from 'node:test';
import assert from 'node:assert/strict';
import { textEmailHtml } from '../scripts/email-accessibility.mjs';
import { sendAlert } from '../scripts/uptime-monitor.mjs';

test('text-only booking and backup notices gain large readable HTML without interpreting their contents', () => {
  const html = textEmailHtml('Backup <alert>', 'Name: A & B\n\n- /uploads/<photo>.png');
  assert.match(html, /font-size:22px/);
  assert.match(html, /font-size:34px/);
  assert.match(html, /<strong>Name:<\/strong> A &amp; B/);
  assert.match(html, /<strong>- \/uploads\/&lt;photo&gt;.png<\/strong>/);
  assert.doesNotMatch(html, /<photo>/);
});

test('outage, recovery and monitor confirmation payloads retain text and accessible HTML', async t => {
  const previous = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 'test-only';
  t.after(() => { if (previous === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous; });
  for (const kind of ['down', 'up', 'test']) {
    let payload;
    await sendAlert(kind, { checkedAt: '2026-10-22T14:00:00Z', results: [{ endpoint: '/api/health', healthy: false, error: '<script>bad</script>' }, { endpoint: '/', healthy: true }] }, async (_url, options) => {
      payload = JSON.parse(options.body); return { ok: true };
    });
    assert.match(payload.html, /Health check results<\/h2>/);
    assert.match(payload.html, /font-size:22px/);
    assert.match(payload.html, /FAILED/);
    assert.match(payload.html, /OK/);
    assert.match(payload.html, /&lt;script&gt;/);
    assert.doesNotMatch(payload.html, /<script>/);
    assert.match(payload.text, /\/api\/health/);
  }
});

test('order receipts and every order event use readable headings, item labels and table headers', async t => {
  const sent = [];
  t.mock.module('../backend/src/services/mailer.js', { namedExports: {
    mailerConfigured: true, getEmailRecipients: () => ['owner@example.com'], getEmailSender: () => 'owner@example.com',
    sendEmail: async payload => { sent.push(payload); return { messageId: 'mock' }; },
  } });
  const { sendOrderConfirmationEmails, sendOrderEventEmails } = await import('../backend/src/services/orderEmails.js');
  const order = { orderNumber: '42', customer: { email: 'buyer@example.com' }, lineItems: [{ title: 'Pillow', quantity: 1, lineTotal: 25 }], summary: { finalTotal: 25 } };
  await sendOrderConfirmationEmails(order);
  for (const mail of sent) {
    assert.match(mail.html, /font-size:22px/);
    assert.match(mail.html, /<h1 /);
    assert.match(mail.html, /<strong>Pillow<\/strong>/);
    assert.match(mail.html, /<th scope="col"/);
    assert.ok(mail.text);
  }
  for (const kind of ['payment_required', 'payment_failed', 'changed', 'canceled', 'refunded_only']) {
    sent.length = 0;
    await sendOrderEventEmails(order, { kind, amount: 5 });
    assert.equal(sent.length, 2);
    for (const mail of sent) {
      assert.match(mail.html, /font-size:22px/);
      assert.match(mail.html, /<h1 /);
      assert.ok(mail.text);
    }
  }
});

test('backend sender adds HTML to booking and backup mail for the Resend transport', async t => {
  t.mock.module('../backend/src/config/index.js', { namedExports: { isLocalApp: false, config: { email: { resendApiKey: 'test-only', resendFrom: 'notifications@example.com' } } } });
  let payload;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    payload = JSON.parse(options.body);
    return { ok: true, json: async () => ({ id: 'mock' }) };
  });
  // A fresh import bypasses the order-template test's mailer mock.
  const { sendEmail } = await import('../backend/src/services/mailer.js?accessibility-test');
  await sendEmail({ to: ['owner@example.com'], subject: 'Booking deposit', text: 'Name: A & B\nAmount: $25' });
  assert.match(payload.html, /font-size:22px/);
  assert.match(payload.html, /<strong>Name:<\/strong> A &amp; B/);
  assert.equal(payload.text, 'Name: A & B\nAmount: $25');
});
