import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

// Only client code used by the dashboard belongs to its installable update.
// Catalog records, backups, storefront views, deployment time and dependency
// automation must not manufacture dashboard releases.
export async function dashboardReleaseId(frontendDir) {
  const sources = new Map()
  const visit = async (relative) => {
    relative = relative.split(path.sep).join('/')
    if (sources.has(relative)) return
    const contents = await readFile(path.join(frontendDir, relative), 'utf8')
    sources.set(relative, contents)
    const references = [
      ...contents.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.[^'"]+)['"]/g),
      ...contents.matchAll(/<style\b[^>]*\bsrc=['"](\.[^'"]+)['"]/g),
    ]
    for (const [, reference] of references) {
      const target = path.normalize(path.join(path.dirname(relative), reference))
      const candidates = [target, `${target}.js`, `${target}.vue`, path.join(target, 'index.js')]
      let resolved
      for (const candidate of candidates) {
        if (await stat(path.join(frontendDir, candidate)).then((s) => s.isFile(), () => false)) {
          resolved = candidate
          break
        }
      }
      if (!resolved) throw new Error(`Missing dashboard dependency: ${reference} in ${relative}`)
      await visit(resolved)
    }
  }

  await visit('src/views/DashboardView.vue')
  const visitComponents = async (directory) => {
    for (const entry of await readdir(path.join(frontendDir, directory), { withFileTypes: true })) {
      const relative = path.join(directory, entry.name)
      if (entry.isDirectory()) await visitComponents(relative)
      else if (/\.(vue|js|css|json)$/.test(entry.name)) await visit(relative)
    }
  }
  await visitComponents('src/components/dashboard')

  // Bootstrap and worker changes affect installed apps, but following the
  // bootstrap's router/App imports would also pull in the entire storefront.
  for (const relative of ['src/main.js', 'public/sw.js', 'public/manifest.webmanifest']) {
    sources.set(relative, await readFile(path.join(frontendDir, relative), 'utf8'))
  }
  const router = await readFile(path.join(frontendDir, 'src/router/index.js'), 'utf8')
  const dashboardRoutes = router.match(/path: '\/dashboard',[\s\S]*?(?=\n  \{\n    path: '\/order-success')/)
  if (!dashboardRoutes) throw new Error('Dashboard route boundary changed; review release fingerprint inputs.')
  sources.set('dashboard-routes', dashboardRoutes[0])

  const manifest = JSON.parse(sources.get('public/manifest.webmanifest'))
  const icons = new Set([...(manifest.icons || []).map((icon) => icon.src), '/apple-touch-icon.png', '/apple-touch-icon-dark.png'])
  for (const icon of [...icons].sort()) {
    const relative = `public/${icon.replace(/^\//, '')}`
    sources.set(relative, await readFile(path.join(frontendDir, relative)))
  }

  // Shared theme tokens can affect the dashboard without a dashboard-file edit.
  // Include only referenced declarations (and their dependencies), so changing
  // a shopping-page color does not produce an app update.
  const stylesheet = await readFile(path.join(frontendDir, 'public/styles.css'), 'utf8')
  const declarations = [...stylesheet.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)]
  const usedTokens = new Set([...Array.from(sources.values()).filter((value) => typeof value === 'string').join('\n').matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))
  for (const token of usedTokens) {
    for (const [, name, value] of declarations.filter((m) => m[1] === token)) {
      for (const [, dependency] of value.matchAll(/var\((--[\w-]+)/g)) usedTokens.add(dependency)
      sources.set(`theme:${name}`, value.trim())
    }
  }

  const hash = createHash('sha256')
  for (const [name, contents] of [...sources].sort(([a], [b]) => a.localeCompare(b))) {
    hash.update(name).update('\0').update(contents).update('\0')
  }
  return hash.digest('hex')
}
