import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { probe, confirmHealth, runMonitor, monitorWithFollowups } from '../scripts/uptime-monitor.mjs';

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


test('healthy scheduled checks finish without waiting for follow-ups', async () => {
  let checks = 0;
  const state = await monitorWithFollowups({
    run: async () => { checks++; return { healthy: true }; },
    pause: async () => assert.fail('healthy runs should not wait'),
  });
  assert.equal(checks, 1);
  assert.equal(state.healthy, true);
});

test('outage follow-ups wait 15 minutes and stop on recovery without repeating test emails', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'pine-followups-'));
  try {
    const sent = [];
    let checks = 0;
    const waits = [];
    const state = await monitorWithFollowups({
      stateFile: path.join(directory, 'state.json'),
      testEmail: true,
      check: async () => ({ healthy: ++checks >= 3, results: [] }),
      send: async (kind) => sent.push(kind),
      pause: async (ms) => waits.push(ms),
    });
    assert.deepEqual(waits, [900000, 900000]);
    assert.deepEqual(sent, ['down', 'up']);
    assert.equal(checks, 3);
    assert.equal(state.healthy, true);
    assert.equal(JSON.parse(await readFile(path.join(directory, 'state.json'))).lastNotifiedStatus, 'up');
  } finally { await rm(directory, { recursive: true }); }
});

test('persistent outages stop follow-ups after five hours', async () => {
  let checks = 0;
  let waited = 0;
  const state = await monitorWithFollowups({
    run: async () => { checks++; return { healthy: false }; },
    pause: async (ms) => { waited += ms; },
  });
  assert.equal(checks, 21);
  assert.equal(waited, 5 * 60 * 60 * 1000);
  assert.equal(state.healthy, false);
});
