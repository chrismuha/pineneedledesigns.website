import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dashboardReleases, formatReleaseDate } from '../src/data/dashboardReleases.js'

export const dashboardNotesMarkdown = () => [
  '# Dashboard release notes',
  '',
  'Dashboard changes only, newest first. Historical dates come from the recorded source history; no numbered app releases were previously recorded. Unpublished changes use TBD.',
  '',
  ...dashboardReleases.flatMap((release) => [
    `## ${formatReleaseDate(release.date)}`, '', release.summary, '',
    ...release.categories.flatMap((category) => [
      `### ${category.title}`, '', ...category.bullets.map((bullet) => `- ${bullet}`), '',
    ]),
  ]),
].join('\n')

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const destination = new URL('../../DASHBOARD_RELEASE_NOTES.md', import.meta.url)
  const expected = dashboardNotesMarkdown()
  if (process.argv.includes('--check')) {
    if (await readFile(destination, 'utf8') !== expected) throw new Error('Dashboard release notes are out of sync.')
  } else await writeFile(destination, expected)
}
