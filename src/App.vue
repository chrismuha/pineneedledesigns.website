<template>
  <GlobalHeader v-if="!hideLayout" />
  <main>
    <router-view />
  </main>
  <GlobalFooter v-if="!hideLayout" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GlobalHeader from './components/GlobalHeader.vue'
import GlobalFooter from './components/GlobalFooter.vue'

const route = useRoute()
const hideLayout = computed(() => route.meta.hideLayout)
</script>
