import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { probe, confirmHealth, runMonitor } from '../scripts/uptime-monitor.mjs';

test('a database failure is an outage even when the homepage works', async () => {
  const result = await probe(async (url) => url.endsWith('/api/health')
    ? { ok: true, json: async () => ({ status: 'DEGRADED', mongo: 'disconnected' }) }
    : { ok: true, text: async () => 'Pine Needle Designs' });
  assert.equal(result.healthy, false);
});

test('a transient failed check is retried before declaring an outage', async () => {
  let attempts = 0;
  const result = await confirmHealth(async () => ({ healthy: ++attempts === 2 }), async () => {});
  assert.equal(result.healthy, true);
  assert.equal(attempts, 2);
});

test('emails once per outage and recovery and retries failed email delivery', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'pine-uptime-'));
  try {
    const stateFile = path.join(directory, 'state.json');
    let healthy = true;
    const sent = [];
    const options = { stateFile, check: async () => ({ healthy, results: [] }), send: async (kind) => sent.push(kind) };
    await runMonitor(options);
    assert.deepEqual(sent, []);
    healthy = false;
    await assert.rejects(runMonitor({ ...options, send: async () => { throw new Error('mail unavailable'); } }));
    assert.equal(JSON.parse(await readFile(stateFile)).lastNotifiedStatus, 'up');
    await runMonitor(options);
    await runMonitor(options);
    healthy = true;
    await runMonitor(options);
    await runMonitor(options);
    assert.deepEqual(sent, ['down', 'up']);
  } finally { await rm(directory, { recursive: true }); }
});
