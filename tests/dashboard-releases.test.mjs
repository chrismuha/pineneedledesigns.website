import test from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dashboardReleaseId } from '../frontend/scripts/dashboard-release.mjs'
import { dashboardReleases, formatReleaseDate } from '../frontend/src/data/dashboardReleases.js'
import { dashboardNotesMarkdown } from '../frontend/scripts/dashboard-release-notes.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))

test('dashboard fingerprint ignores site-only deployments and detects dashboard dependencies', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'pine-dashboard-release-'))
  try {
    await cp(path.join(root, 'frontend/src'), path.join(fixture, 'src'), { recursive: true })
    await mkdir(path.join(fixture, 'public'))
    for (const name of ['styles.css', 'sw.js', 'manifest.webmanifest', 'pwa-icon-192.png', 'pwa-icon-512.png', 'pwa-icon-maskable-512.png', 'apple-touch-icon.png', 'apple-touch-icon-dark.png']) {
      await cp(path.join(root, 'frontend/public', name), path.join(fixture, 'public', name))
    }
    const original = await dashboardReleaseId(fixture)
    assert.match(original, /^[a-f0-9]{64}$/)
    assert.equal(await dashboardReleaseId(fixture), original, 'identical inputs must produce identical worker stamps')
    const edit = async (name, change, shouldChange) => {
      const filename = path.join(fixture, name)
      const before = await readFile(filename, 'utf8').catch(() => '')
      await writeFile(filename, change(before))
      assert.equal((await dashboardReleaseId(fixture)) !== original, shouldChange, name)
      await writeFile(filename, before)
    }
    await edit('src/views/HomeView.vue', (s) => `${s}\n<!-- Storefront change -->`, false)
    await edit('src/components/GlobalHeader.vue', (s) => `${s}\n<!-- Shopping navigation change -->`, false)
    await edit('src/router/index.js', (s) => s.replace("name: 'Home'", "name: 'Storefront'"), false)
    await edit('public/styles.css', (s) => `${s}\n.storefront-only { color: purple; }`, false)
    await edit('package-lock.json', () => '{"dependencyUpdate":true}', false)
    await edit('RELEASE_NOTES.md', () => '# Site deployment documentation', false)
    await edit('src/components/dashboard/DashboardSettings.vue', (s) => s.replace('Manage checkout', 'Manage store checkout'), true)
    await edit('src/utils/itemDrafts.js', (s) => `${s}\nexport const changedDraftBehavior = true`, true)
    await edit('src/styles/dashboard.css', (s) => `${s}\n.dashboard-shell { padding: 1px; }`, true)
    await edit('public/styles.css', (s) => s.replace('--dashboard-primary-action-color:', '--unused-color: red; --dashboard-primary-action-color:'), false)
    await edit('public/styles.css', (s) => s.replace(/(--dashboard-primary-action-color:)\s*[^;]+;/, '$1 purple;'), true)
    await edit('src/router/index.js', (s) => s.replace("path: 'settings'", "path: 'preferences'"), true)
    await edit('public/manifest.webmanifest', (s) => s.replace('Pine Needle', 'Pine Needles'), true)
    await edit('public/sw.js', (s) => s.replace('App update available', 'Dashboard update available'), true)
    await edit('src/data/dashboardReleases.js', (s) => s.replace('Dashboard updates and', 'Dashboard improvements and'), true)
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
})

test('dashboard timeline preserves chronological dates and alphabetical categories and bullets', async () => {
  assert.equal(dashboardReleases[0].date, 'TBD')
  const dates = dashboardReleases.slice(1).map((release) => release.date)
  assert.deepEqual(dates, [...dates].sort().reverse())
  assert.equal(new Set(dates).size, dates.length)
  for (const release of dashboardReleases) {
    const categories = release.categories.map((category) => category.title)
    assert.deepEqual(categories, [...categories].sort((a, b) => a.localeCompare(b)), release.date)
    for (const category of release.categories) {
      assert.deepEqual(category.bullets, [...category.bullets].sort((a, b) => a.localeCompare(b)), `${release.date}: ${category.title}`)
    }
    if (release.date !== 'TBD') {
      assert.match(release.date, /^\d{4}-\d{2}-\d{2}$/)
      assert.ok(release.sources.length, 'historical changes must have source evidence')
    }
  }
  assert.equal(formatReleaseDate('2026-11-11'), 'November 11, 2026')
  assert.equal(await readFile(path.join(root, 'DASHBOARD_RELEASE_NOTES.md'), 'utf8'), dashboardNotesMarkdown())
  const siteNotes = await readFile(path.join(root, 'RELEASE_NOTES.md'), 'utf8')
  for (const category of dashboardReleases[0].categories) {
    for (const bullet of category.bullets) assert.ok(siteNotes.includes(`- ${bullet}`))
  }
})
