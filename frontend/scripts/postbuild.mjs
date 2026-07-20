import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDir = path.resolve(__dirname, '..')
const rootDir = path.resolve(frontendDir, '..')
const docsDir = path.join(rootDir, 'docs')

const removeStaleBuildAssets = async () => {
  const assetsDir = path.join(docsDir, 'assets')
  const indexHtml = await readFile(path.join(docsDir, 'index.html'), 'utf8')
  const referencedAssets = new Set(
    [...indexHtml.matchAll(/\/assets\/(index-[^"'\s>]+\.(?:js|css))/g)]
      .map((match) => match[1]),
  )
  const assets = await readdir(assetsDir, { withFileTypes: true })

  await Promise.all(assets
    .filter((entry) => (
      entry.isFile()
      && /^index-.*\.(?:js|css)$/.test(entry.name)
      && !referencedAssets.has(entry.name)
    ))
    .map((entry) => rm(path.join(assetsDir, entry.name), { force: true })))
}

const copyIfChanged = async (source, destination) => {
  try {
    const [sourceStat, destinationStat] = await Promise.all([
      stat(source),
      stat(destination),
    ])

    if (sourceStat.size === destinationStat.size) {
      const [sourceContents, destinationContents] = await Promise.all([
        readFile(source),
        readFile(destination),
      ])

      if (sourceContents.equals(destinationContents)) {
        return
      }
    }
  } catch {
    // A missing destination is expected on the first build.
  }

  await mkdir(path.dirname(destination), { recursive: true })
  await cp(source, destination, { force: true })
}

const copyIfExists = async (source, destination) => {
  try {
    await stat(source)
  } catch {
    return
  }

  await copyIfChanged(source, destination)
}

const syncDirectory = async (sourceDir, destinationDir, options = {}) => {
  try {
    await stat(sourceDir)
  } catch {
    return
  }

  await mkdir(destinationDir, { recursive: true })

  const sourceEntries = await readdir(sourceDir, { withFileTypes: true })
  const expectedEntries = new Set()

  for (const entry of sourceEntries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const destinationPath = path.join(destinationDir, entry.name)

    if (entry.isDirectory()) {
      expectedEntries.add(entry.name)
      await syncDirectory(sourcePath, destinationPath, options)
      continue
    }

    if (options.filter && !options.filter(entry.name, sourcePath)) {
      continue
    }

    expectedEntries.add(entry.name)
    await copyIfChanged(sourcePath, destinationPath)
  }

  const destinationEntries = await readdir(destinationDir, { withFileTypes: true })
  for (const entry of destinationEntries) {
    if (!expectedEntries.has(entry.name)) {
      await rm(path.join(destinationDir, entry.name), { recursive: true, force: true })
    }
  }
}

await removeStaleBuildAssets()

const buildId = new Date().toISOString()
const serviceWorkerPath = path.join(docsDir, 'sw.js')
const serviceWorker = await readFile(serviceWorkerPath, 'utf8')
await writeFile(
  serviceWorkerPath,
  serviceWorker.replace('__PINE_NEEDLE_BUILD_ID__', buildId),
)

const builtIndexPath = path.join(docsDir, 'index.html')
const builtIndex = await readFile(builtIndexPath, 'utf8')
await writeFile(
  builtIndexPath,
  builtIndex.replaceAll('__PINE_NEEDLE_BUILD_ID__', encodeURIComponent(buildId)),
)

await copyIfExists(path.join(rootDir, 'CNAME'), path.join(docsDir, 'CNAME'))
await syncDirectory(path.join(frontendDir, 'images'), path.join(docsDir, 'images'))
await syncDirectory(path.join(rootDir, 'videos'), path.join(docsDir, 'videos'), {
  filter: (name) => name.toLowerCase().endsWith('.webm'),
})
