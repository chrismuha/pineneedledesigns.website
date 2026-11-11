<script setup>
import { ref } from 'vue'
import { dashboardReleases, formatReleaseDate } from '../../data/dashboardReleases.js'
import DashboardReleaseEntry from './DashboardReleaseEntry.vue'

const dialog = ref(null)
const [latest, ...history] = dashboardReleases
</script>

<template>
  <section class="release-notes-link">
    <div>
      <strong>What’s New</strong>
      <p>See what changed in the dashboard and browse earlier releases.</p>
    </div>
    <button type="button" class="btn-outline" @click="dialog.showModal()">
      <i class="bi bi-clock-history" aria-hidden="true"></i> Release notes
    </button>
  </section>
  <dialog ref="dialog" class="release-notes-dialog" aria-labelledby="dashboard-release-title">
    <header>
      <div>
        <span class="notes-eyebrow">Current dashboard</span>
        <h2 id="dashboard-release-title">What’s New</h2>
        <p>Dashboard improvements, in one place.</p>
      </div>
      <button type="button" class="notes-close" aria-label="Close release notes" @click="dialog.close()">×</button>
    </header>
    <div class="notes-content" tabindex="0" aria-label="Dashboard release timeline">
      <section class="latest-release" aria-labelledby="latest-dashboard-release">
        <h2 id="latest-dashboard-release" class="notes-eyebrow">Latest Version</h2>
        <DashboardReleaseEntry :release="latest" />
      </section>
      <section class="release-history" aria-labelledby="dashboard-release-history">
        <h2 id="dashboard-release-history">Version History</h2>
        <p class="history-intro">Earlier dashboard changes, newest first. Dates follow the recorded dashboard change history; the app did not previously use numbered releases. Website-only changes are excluded.</p>
        <details v-for="release in history" :key="release.date">
          <summary>
            <span><time :datetime="release.date">{{ formatReleaseDate(release.date) }}</time><small>{{ release.summary }}</small></span>
          </summary>
          <div class="history-entry"><DashboardReleaseEntry :release="release" /></div>
        </details>
      </section>
    </div>
    <footer><button type="button" class="btn-primary" @click="dialog.close()">Done</button></footer>
  </dialog>
</template>

<style scoped>
.release-notes-link { display: flex; justify-content: space-between; align-items: center; gap: 18px; margin-bottom: 24px; padding: 20px; border: 1px solid var(--dashboard-settings-settings-card-border); border-radius: 16px; background: var(--dashboard-settings-settings-card-surface); color: var(--dashboard-settings-section-heading-h2-text); }
.release-notes-link p { margin: 4px 0 0; color: var(--dashboard-settings-settings-heading-p-text); line-height: 1.5; }
.release-notes-link button { min-height: 48px; flex-shrink: 0; }
.release-notes-dialog { --notes-surface: var(--dashboard-settings-settings-card-surface); --notes-ink: var(--dashboard-settings-section-heading-h2-text); --notes-muted: var(--dashboard-settings-settings-heading-p-text); --notes-border: var(--dashboard-settings-settings-card-border); --notes-accent: var(--dashboard-primary-action-color); width: min(760px, calc(100vw - 24px)); max-height: min(90dvh, 960px); padding: 0; border: 1px solid var(--notes-border); border-radius: 20px; background: var(--notes-surface); color: var(--notes-ink); box-shadow: 0 24px 70px var(--app-update-dialog-shadow); overflow: hidden; }
.release-notes-dialog[open] { display: flex; flex-direction: column; }
.release-notes-dialog::backdrop { background: rgba(0, 0, 0, .5); }
header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 24px; border-bottom: 1px solid var(--notes-border); }
header h2 { margin: 4px 0; font-size: 1.8rem; font-weight: 600; color: var(--notes-ink); }
header p { margin: 0; color: var(--notes-muted); }
.notes-eyebrow { display: block; font-size: .8rem; letter-spacing: .08em; text-transform: uppercase; font-weight: 700; color: var(--notes-accent); margin: 0 0 12px; }
.notes-close { width: 48px; height: 48px; flex-shrink: 0; border: 1px solid var(--notes-border); border-radius: 12px; background: var(--notes-surface); color: var(--notes-ink); font-size: 1.8rem; }
.notes-content { overflow-y: auto; overscroll-behavior: contain; min-height: 0; padding: 24px; }
.latest-release { border-left: 4px solid var(--notes-accent); padding-left: 20px; }
.release-history { margin-top: 36px; }
.release-history > h2 { font-size: 1.3rem; font-weight: 600; color: var(--notes-ink); }
.history-intro { color: var(--notes-muted); line-height: 1.7; }
details { border: 1px solid var(--notes-border); border-radius: 12px; margin-top: 12px; }
summary { cursor: pointer; padding: 18px; }
summary time { font-weight: 700; }
summary small { display: block; font-size: .9rem; margin-top: 6px; color: var(--notes-muted); line-height: 1.5; }
.history-entry { padding: 8px 20px 24px; }
footer { display: flex; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid var(--notes-border); }
footer button { min-width: 110px; min-height: 48px; }
button:focus-visible, summary:focus-visible, .notes-content:focus-visible { outline: 3px solid var(--notes-accent); outline-offset: -3px; }
@media (max-width: 520px) {
  .release-notes-link { align-items: stretch; flex-direction: column; }
  header, .notes-content { padding: 18px; }
  .latest-release { padding-left: 14px; }
}
@media (prefers-color-scheme: dark) {
  .release-notes-dialog { --notes-surface: var(--dark-surface); --notes-ink: var(--soft-ink); --notes-muted: #b8c7bd; --notes-border: #415348; --notes-accent: #9fd9ae; }
}
</style>
