import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import session from 'express-session';
import { once } from 'node:events';
let authCalls = 0;
mock.module('../backend/src/middleware/cloudflareAccess.js', { namedExports: { requireCloudflareAccess(_req, res) { authCalls += 1; res.sendStatus(401); } } });
mock.module('../backend/src/middleware/session.js', { namedExports: { createSessionMiddleware: () => session({ secret: 'isolated-security-fixture', resave: false, saveUninitialized: false }) } });
mock.module('../backend/src/middleware/seo.js', { namedExports: { createSeoMiddleware: () => (_req, _res, next) => next() } });
mock.module('../backend/src/routes/index.js', { defaultExport: express.Router() });
const { createApp } = await import('../backend/src/app.js');

test('dashboard auth is limited before verification, without consuming the API quota', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (let i = 0; i < 300; i += 1) {
    const response = await fetch(`${origin}/dashboard`);
    assert.equal(response.status, 401);
    await response.text();
  }
  const blocked = await fetch(`${origin}/dashboard`);
  assert.equal(blocked.status, 429);
  await blocked.text();
  assert.equal(authCalls, 300);
  const api = await fetch(`${origin}/api/csrf-token`);
  assert.equal(api.status, 200);
  assert.ok((await api.json()).token);
});
