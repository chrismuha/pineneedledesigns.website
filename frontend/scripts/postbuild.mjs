import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDir = path.resolve(__dirname, '..')
const rootDir = path.resolve(frontendDir, '..')
const docsDir = path.join(rootDir, 'docs')

const copyIfExists = async (source, destination) => {
  try {
    await stat(source)
  } catch {
    return
  }

  await mkdir(path.dirname(destination), { recursive: true })
  await cp(source, destination, { recursive: true, force: true })
}

const syncDirectory = async (sourceDir, destinationDir, options = {}) => {
  try {
    await stat(sourceDir)
  } catch {
    return
  }

  await rm(destinationDir, { recursive: true, force: true })
  await mkdir(destinationDir, { recursive: true })

  const entries = await readdir(sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const destinationPath = path.join(destinationDir, entry.name)

    if (entry.isDirectory()) {
      await syncDirectory(sourcePath, destinationPath, options)
      continue
    }

    if (options.filter && !options.filter(entry.name, sourcePath)) {
      continue
    }

    await cp(sourcePath, destinationPath, { force: true })
  }
}

await copyIfExists(path.join(rootDir, 'CNAME'), path.join(docsDir, 'CNAME'))
await syncDirectory(path.join(frontendDir, 'images'), path.join(docsDir, 'images'))
await syncDirectory(path.join(rootDir, 'videos'), path.join(docsDir, 'videos'), {
  filter: (name) => name.toLowerCase().endsWith('.webm'),
})
