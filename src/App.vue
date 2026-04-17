<template>
  <GlobalHeader />
  <main>
    <router-view />
  </main>
  <GlobalFooter />
</template>

<script setup>
import GlobalHeader from './components/GlobalHeader.vue'
import GlobalFooter from './components/GlobalFooter.vue'
</script>
