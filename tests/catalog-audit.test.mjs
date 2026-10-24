import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const events = [];
let unavailable = false;
mock.module('../backend/src/models/CatalogAuditEvent.js', {
  namedExports: { CatalogAuditEvent: {
    create: async (event) => {
      if (unavailable) throw new Error('audit unavailable');
      const stored = { ...event, _id: events.length };
      events.push(stored);
      return stored;
    },
    updateOne: async ({ _id }, { $set }) => Object.assign(events[_id], $set),
  } },
});
mock.module('../backend/src/config/index.js', { namedExports: { config: { uploadsDir: '/tmp/pine-test-uploads' } } });
const { auditedRemoval, removeUploadedMedia } = await import('../backend/src/services/catalogAudit.js');

test('audit intent precedes removal and completion has its own timestamp', async () => {
  const result = await auditedRemoval({ targets: [{ key: 'products:one', name: 'One' }], reason: 'Product deleted' }, async () => {
    assert.equal(events.at(-1).status, 'pending');
    return 'removed';
  });
  assert.equal(result, 'removed');
  assert.equal(events.at(-1).status, 'completed');
  assert.ok(events.at(-1).completedAt >= events.at(-1).startedAt);
});

test('audit failure prevents deletion', async () => {
  unavailable = true;
  let deleted = false;
  try {
    await assert.rejects(auditedRemoval({ targets: [], reason: 'test' }, async () => { deleted = true; }));
    assert.equal(deleted, false);
  } finally { unavailable = false; }
});

test('unsuccessful removals are not labelled completed', async () => {
  await assert.rejects(auditedRemoval({ targets: [], reason: 'test' }, async () => { throw new Error('disk error'); }));
  assert.equal(events.at(-1).status, 'failed');
  assert.equal(events.at(-1).completedAt, undefined);
});

test('media audit uses original URL and rejects traversal', async (t) => {
  const calls = [];
  t.mock.method(fs, 'unlink', async (file) => calls.push(file));
  await removeUploadedMedia('/uploads/photo.webp', 'Product deleted');
  assert.deepEqual(calls, ['/tmp/pine-test-uploads/photo.webp']);
  assert.equal(events.at(-1).targets[0].key, 'media:/uploads/photo.webp');
  await assert.rejects(removeUploadedMedia('/uploads/../photo.webp', 'test'));
  assert.equal(calls.length, 1);
});
