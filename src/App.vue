<template>
  <template v-if="isDashboard">
    <router-view />
  </template>

  <template v-else>
    <GlobalHeader @toggle-cart="toggleCart" />

    <main>
      <router-view />
    </main>

    <GlobalFooter />

    <button
      v-if="cartStore.totalItems > 0 && !cartStore.isOpen"
      class="floating-cart-btn"
      type="button"
      aria-label="Open cart"
      @click="toggleCart"
    >
      <i class="bi bi-bag"></i>
      <span class="floating-cart-btn__count">
        {{ cartStore.totalItems }}
      </span>
    </button>

    <CartSidebar />
  </template>
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

const isDashboard = computed(() =>
  route.path.startsWith('/dashboard')
)

const cartStore = useCartStore()

const toggleCart = () => {
  cartStore.toggleOpen()
}
</script>

<style scoped>
.floating-cart-btn {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 930;
  width: 58px;
  height: 58px;
  border: 0;
  border-radius: 50%;
  background: var(--accent);
  color: var(--white);
  box-shadow: var(--shadow);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24pt;
  line-height: 1;
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease;
}

.floating-cart-btn:hover {
  background: var(--accent-2);
  transform: translateY(-2px);
}

.floating-cart-btn:focus-visible {
  outline: 3px solid var(--brand-red-45);
  outline-offset: 4px;
}

.floating-cart-btn__count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 22px;
  height: 22px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--error);
  color: var(--white);
  border: 2px solid var(--white);
  font-size: 10pt;
  font-weight: 700;
  line-height: 16px;
}

@media (max-width: 640px) {
  .floating-cart-btn {
    right: 14px;
    bottom: calc(92px + env(safe-area-inset-bottom));
    width: 54px;
    height: 54px;
    font-size: 22pt;
  }
}
</style>
