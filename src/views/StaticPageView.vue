<template>
  <section class="static-page">
    <div class="container">
      <h1>{{ page.title }}</h1>
      <div class="page-content" v-html="page.content"></div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { sitePages } from '../data/siteData'

const route = useRoute()
const page = computed(() => sitePages.find((item) => item.path === route.path) || sitePages[0])
</script>
