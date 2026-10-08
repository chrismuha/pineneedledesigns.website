import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
mock.module('../backend/src/models/Product.js', { namedExports: { Product: { updateOne: async () => ({ modifiedCount: 1 }) } } });
mock.module('../backend/src/middleware/upload.js', { namedExports: { transcodeToWebm: async () => {} } });
const { queueVideoTranscode } = await import('../backend/src/services/videoTranscoder.js');

test('user filenames are log arguments, never the format string', async (t) => {
  let resolveError, resolveLog;
  const errorEvent = new Promise((resolve) => { resolveError = resolve; });
  const logEvent = new Promise((resolve) => { resolveLog = resolve; });
  t.mock.method(fs, 'unlink', async () => { throw Object.assign(new Error('test permission error'), { code: 'EACCES' }); });
  t.mock.method(console, 'error', (...args) => resolveError(args));
  t.mock.method(console, 'log', (...args) => resolveLog(args));
  const filename = 'clip-%s-%d.mp4';
  queueVideoTranscode({ productId: 'product', files: [{ filename, pendingTranscode: true }] });
  const [error, log] = await Promise.all([errorEvent, logEvent]);
  assert.equal(error[0], '[videoTranscoder] failed to remove %s:');
  assert.equal(error[1], filename);
  assert.equal(log[0], '[videoTranscoder] background-transcoded %s -> %s in %dms (product %s)');
  assert.equal(log[1], filename);
  assert.equal(log[2], 'clip-%s-%d.webm');
  assert.equal(log[4], 'product');
});
