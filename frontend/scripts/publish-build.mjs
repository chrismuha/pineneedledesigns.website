import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendDir = path.resolve(__dirname, '..')
const rootDir = path.resolve(frontendDir, '..')
const buildDir = path.join(os.tmpdir(), 'pineneedledesigns-frontend-dist')
const docsDir = path.join(rootDir, 'docs')

await stat(path.join(buildDir, 'index.html'))
await mkdir(docsDir, { recursive: true })

// Overlay a fully completed Vite build. The build never clears docs, so a
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

const buildId = new Date().toISOString()
for (const filename of ['index.html', 'sw.js']) {
  const destination = path.join(docsDir, filename)
  const contents = await readFile(destination, 'utf8')
  await writeFile(destination, contents.replaceAll('__PINE_NEEDLE_BUILD_ID__', encodeURIComponent(buildId)))
}

await cp(path.join(rootDir, 'CNAME'), path.join(docsDir, 'CNAME'), { force: true })
