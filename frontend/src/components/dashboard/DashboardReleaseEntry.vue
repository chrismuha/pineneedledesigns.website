<script setup>
import { formatReleaseDate } from '../../data/dashboardReleases.js'
defineProps({ release: { type: Object, required: true } })
</script>

<template>
  <article class="release-entry">
    <p class="release-date">
      <span v-if="release.date === 'TBD'">TBD · Not yet published</span>
      <time v-else :datetime="release.date">{{ formatReleaseDate(release.date) }}</time>
    </p>
    <h3>{{ release.summary }}</h3>
    <section v-for="category in release.categories" :key="category.title" class="release-category">
      <h4><i :class="['bi', category.icon]" aria-hidden="true"></i>{{ category.title }}</h4>
      <ul><li v-for="bullet in category.bullets" :key="bullet">{{ bullet }}</li></ul>
    </section>
  </article>
</template>

<style scoped>
.release-date { color: var(--notes-muted); font-size: .9rem; margin: 0 0 8px; }
h3 { font-size: 1.15rem; line-height: 1.5; margin: 0 0 24px; color: var(--notes-ink); font-weight: 600; }
.release-category + .release-category { margin-top: 22px; }
h4 { display: flex; gap: 10px; align-items: center; color: var(--notes-ink); font-size: 1rem; font-weight: 700; margin: 0 0 10px; }
h4 i { color: var(--notes-accent); }
ul { padding-left: 1.4em; margin: 0; }
li { padding-left: 4px; line-height: 1.7; overflow-wrap: anywhere; }
li + li { margin-top: 10px; }
</style>
