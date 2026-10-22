import { emailDocument, escapeEmailHtml } from './email-accessibility.mjs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const origin = 'https://pineneedledesigns.store';
const recipient = 'muhachris297@gmail.com';

export async function probe(fetcher = fetch) {
  const results = await Promise.all(['/', '/api/health'].map(async (endpoint) => {
    try {
      const response = await fetcher(origin + endpoint, {
        headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'PineNeedleExternalMonitor/1.0' },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (endpoint === '/api/health') {
        const body = await response.json();
        if (body.status !== 'OK' || body.mongo !== 'connected') throw new Error('Database health check failed');
      } else if (!/Pine Needle/i.test(await response.text())) {
        throw new Error('Homepage did not contain the expected website');
      }
      return { endpoint, healthy: true };
    } catch (error) {
      return { endpoint, healthy: false, error: String(error.message).slice(0, 200) };
    }
  }));
  return { healthy: results.every((result) => result.healthy), results };
}

export async function confirmHealth(check = probe, pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))) {
  let result;
  for (let attempt = 0; attempt < 3; attempt++) {
    result = await check();
    if (result.healthy) return result;
    if (attempt < 2) await pause(10000);
  }
  return result;
}

export async function sendAlert(kind, report, fetcher = fetch) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
  const labels = { down: 'website is DOWN', up: 'website is BACK ONLINE', test: 'external uptime monitor is enabled' };
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `pine-uptime-${process.env.GITHUB_RUN_ID || Date.now()}-${kind}`,
    },
    body: JSON.stringify({
      from: 'Pine Needle Designs <notifications@notifications.pineneedledesigns.store>',
      to: [recipient],
      subject: `Pine Needle: ${labels[kind]}`,
      html: emailDocument(`Pine Needle: ${labels[kind]}`, `
        <p><strong>Website:</strong> <a href="${origin}" style="color:#0645ad;text-decoration:underline;">${origin}</a><br><strong>Checked:</strong> ${escapeEmailHtml(report.checkedAt)}</p>
        <h2 style="font-size:28px;line-height:1.35;">Health check results</h2>
        <ul>${report.results.map(item => `<li style="margin-bottom:16px;"><strong>${escapeEmailHtml(item.endpoint)}: ${item.healthy ? 'OK' : 'FAILED'}</strong>${item.healthy ? '' : '<br>' + escapeEmailHtml(item.error)}</li>`).join('')}</ul>
        <h2 style="font-size:28px;line-height:1.35;">About these alerts</h2>
        <p>This check runs on GitHub, independently of the website server and both Macs. Checks are scheduled every six hours; GitHub may delay scheduled runs. Outages between checks may go undetected. You receive one outage alert and one recovery alert per observed incident.</p>`),
      text: `${origin}\nChecked: ${report.checkedAt}\n\n${labels[kind]}.\n\n`
        + report.results.map((item) => `${item.endpoint}: ${item.healthy ? 'OK' : item.error}`).join('\n')
        + '\n\nThis check runs on GitHub, independently of the website server and both Macs. Checks are scheduled every six hours; GitHub may delay scheduled runs. Outages between checks may go undetected. You receive one outage alert and one recovery alert per observed incident.'
        + `\n\nRun: ${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY || 'chrismuha/pineneedledesigns.website'}/actions/runs/${process.env.GITHUB_RUN_ID || ''}`,
    }),
  });
  if (!response.ok) throw new Error(`Email service rejected the alert (HTTP ${response.status})`);
}

export async function runMonitor({ stateFile, check = confirmHealth, send = sendAlert, testEmail = false }) {
  let previous = { lastNotifiedStatus: 'up' };
  try { previous = JSON.parse(await readFile(stateFile, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const report = { ...await check(), checkedAt: new Date().toISOString() };
  const status = report.healthy ? 'up' : 'down';
  const state = { ...previous, observedStatus: status, ...report };
  async function save() {
    await mkdir(path.dirname(stateFile), { recursive: true });
    await writeFile(stateFile + '.tmp', JSON.stringify(state, null, 2) + '\n');
    await rename(stateFile + '.tmp', stateFile);
  }
  // Retain the last notified state if sending fails so the next run retries.
  await save();
  if (status !== previous.lastNotifiedStatus) {
    await send(status, report);
    state.lastNotifiedStatus = status;
    await save();
  } else if (testEmail) {
    await send('test', report);
  }
  return state;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const state = await runMonitor({ stateFile: '.uptime-state/status.json', testEmail: process.env.SEND_TEST_EMAIL === 'true' });
    console.log(JSON.stringify(state, null, 2));
    if (process.env.GITHUB_STEP_SUMMARY) {
      await writeFile(process.env.GITHUB_STEP_SUMMARY, `Website: **${state.observedStatus.toUpperCase()}**\n\nChecked ${state.checkedAt}.\n`);
    }
    if (!state.healthy) process.exitCode = 1;
  } catch (error) {
    console.error('Uptime monitoring failed:', error.message);
    process.exitCode = 1;
  }
}
