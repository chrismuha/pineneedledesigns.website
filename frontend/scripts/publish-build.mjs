import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dashboardReleaseId } from './dashboard-release.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDir = path.resolve(__dirname, '..')
const rootDir = path.resolve(frontendDir, '..')
const buildDir = path.join(os.tmpdir(), 'pineneedledesigns-frontend-dist')
const docsDir = path.join(rootDir, 'docs')

await stat(path.join(buildDir, 'index.html'))
// Storefront cache busting remains independent of dashboard update detection.
const replacements = {
  'index.html': ['__PINE_NEEDLE_BUILD_ID__', encodeURIComponent(new Date().toISOString())],
  'sw.js': ['__PINE_NEEDLE_DASHBOARD_RELEASE__', await dashboardReleaseId(frontendDir)],
}
for (const [filename, [placeholder]] of Object.entries(replacements)) {
  if (!(await readFile(path.join(buildDir, filename), 'utf8')).includes(placeholder)) {
    throw new Error(`Missing release placeholder in ${filename}`)
  }
}

await mkdir(docsDir, { recursive: true })

// Overlay a fully completed Vite build into ignored runtime output. The build never clears docs, so a
// Dropbox placeholder or interrupted build cannot make the deployed tree look
// deleted. Product media lives in backend/uploads and is not part of this build.
for (const entry of await readdir(buildDir, { withFileTypes: true })) {
  await cp(
    path.join(buildDir, entry.name),
    path.join(docsDir, entry.name),
    { recursive: true, force: true },
  )
}

const expectedAssets = new Set(await readdir(path.join(buildDir, 'assets')))

for (const entry of await readdir(path.join(docsDir, 'assets'), { withFileTypes: true })) {
  if (entry.isFile() && /\.(?:js|css)$/.test(entry.name) && !expectedAssets.has(entry.name)) {
    await rm(path.join(docsDir, 'assets', entry.name), { force: true })
  }
}

for (const [filename, [placeholder, value]] of Object.entries(replacements)) {
  const destination = path.join(docsDir, filename)
  const contents = await readFile(destination, 'utf8')
  if (!contents.includes(placeholder)) throw new Error(`Missing release placeholder in ${filename}`)
  await writeFile(destination, contents.replaceAll(placeholder, value))
}

await cp(path.join(rootDir, 'CNAME'), path.join(docsDir, 'CNAME'), { force: true })
