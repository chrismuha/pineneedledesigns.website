<template>
  <GlobalHeader v-if="!hideLayout" @toggle-cart="toggleCart" />
  <main>
    <router-view />
  </main>
  <GlobalFooter v-if="!hideLayout" />
  <CartSidebar />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GlobalHeader from './components/GlobalHeader.vue'
import GlobalFooter from './components/GlobalFooter.vue'
import CartSidebar from './components/CartSidebar.vue'
import { useCartStore } from './stores/cart'

const route = useRoute()
const hideLayout = computed(() => route.meta.hideLayout)
const cartStore = useCartStore()

const toggleCart = () => {
  cartStore.toggleOpen()
}
</script>
