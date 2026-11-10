<template>
  <header>
    <div class="container nav" role="navigation" aria-label="Primary">
      <div class="nav-actions" :class="{ 'nav-actions--dimmed': chromeDimmed }">
        <router-link class="icon-btn" to="/" aria-label="Home" :class="{ active: route.path === '/' }">
          <i class="bi bi-house"></i>
        </router-link>

        <router-link
          v-if="installedApp"
          class="icon-btn"
          to="/dashboard"
          aria-label="Back to dashboard"
        >
          <i class="bi bi-speedometer2"></i>
        </router-link>

        <router-link
          class="icon-btn"
          to="/collections"
          aria-label="All collections"
          :class="{ active: route.path.startsWith('/collections') }"
        >
          <i class="bi bi-shop"></i>
        </router-link>

        <button
          id="menuBtn"
          class="nav-toggle"
          aria-controls="mnav"
          :aria-expanded="String(menuOpen)"
          aria-label="Toggle navigation menu"
          @click="toggleMenu"
        >
          <span class="nav-toggle__bar" aria-hidden="true"></span>
          <span class="nav-toggle__bar" aria-hidden="true"></span>
          <span class="nav-toggle__bar" aria-hidden="true"></span>
        </button>

        <button class="icon-btn" @click="$emit('toggle-cart')" aria-label="Cart">
          <i class="bi bi-bag"></i>
          <span v-if="cartStore.totalItems > 0" class="cart-count">{{ cartStore.totalItems }}</span>
        </button>
      </div>

      <div class="brand">
        <div class="brand-logos">
          <router-link class="brand-home-link" to="/" aria-label="Pine Needle Designs home">
            <span class="brand-name">Pine Needle Designs</span>
            <img src="/images/wende-portrait.webp" alt="Wende of Pine Needle Designs" width="1283" height="1403" loading="eager" fetchpriority="high" decoding="async" />
            <span class="designer-name">Wende Maliani</span>
          </router-link>
        </div>
        <div id="header-booking-slot" class="header-booking-slot" aria-label="Book a fitting"></div>
      </div>
    </div>

    <nav class="nav-main" :class="{ 'nav-main--dimmed': chromeDimmed }" aria-label="Main">
      <div v-for="link in navLinks" :key="link.path" class="nav-entry">
        <router-link :to="link.path" :class="{ active: isNavLinkActive(link) }">{{ link.label }}</router-link>
        <div v-if="link.children" class="nav-children">
          <router-link v-for="child in link.children" :key="child.path" :to="child.path" :class="{ active: isNavLinkActive(child) }">{{ child.label }}</router-link>
        </div>
      </div>
    </nav>

    <nav
      id="mnav"
      class="mobile-nav"
      aria-label="Mobile menu"
      :class="{ 'mobile-nav--open': menuOpen, 'mobile-nav--dimmed': chromeDimmed }"
    >
      <div v-for="link in navLinks" :key="link.path" class="nav-entry">
        <router-link :to="link.path" :class="{ active: isNavLinkActive(link) }" @click="closeMenu">{{ link.label }}</router-link>
        <div v-if="link.children" class="nav-children">
          <router-link v-for="child in link.children" :key="child.path" :to="child.path" :class="{ active: isNavLinkActive(child) }" @click="closeMenu">{{ child.label }}</router-link>
        </div>
      </div>
    </nav>

  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { buildCollectionNavLinks } from '../data/collectionCategoryOrder.js'
import { useCatalogStore } from '../stores/catalog.js'
import { useCartStore } from '../stores/cart'
import { isInstalledPwa } from '../utils/pwaDisplayMode.js'

const menuOpen = ref(false)
const route = useRoute()
const cartStore = useCartStore()
const catalogStore = useCatalogStore()
const installedApp = isInstalledPwa()

const navLinks = computed(() => buildCollectionNavLinks(catalogStore.navLinks.length
  ? catalogStore.navLinks
  : [
    { label: 'Home', path: '/' },
    { label: 'All Collections', path: '/collections' },
  ], catalogStore.collectionPages))

defineProps({
  chromeDimmed: {
    type: Boolean,
    default: false,
  },
})

const closeMenu = () => {
  menuOpen.value = false
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const isNavLinkActive = (link) => {
  if (link.path === '/') return route.path === '/'
  if (link.path === '/collections') return route.path.startsWith('/collections')
  return route.path === link.path
}

const handleEscape = (event) => {
  if (event.key === 'Escape') closeMenu()
}

const handleDocumentClick = (event) => {
  const target = event.target
  const menu = document.getElementById('mnav')
  const button = document.getElementById('menuBtn')
  if (!menu || !button) return
  if (!menu.contains(target) && !button.contains(target)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
})

watch(
  () => route.path,
  () => {
    closeMenu()
  }
)
</script>

<style scoped>
.header-booking-slot {
  width: min(420px, calc(100vw - 32px));
  margin: 14px auto 22px;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--error);
  color: var(--white);
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 9pt;
  min-width: 18px;
  text-align: center;
}

.nav-actions {
  position: fixed;
  top: 8px;
  left: 18px;
  z-index: 960;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: flex-start;
  padding: 4px;
  border: 1px solid var(--black-08);
  border-radius: 999px;
  background: var(--white-92);
  box-shadow: var(--shadow-sm);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  transition: opacity 180ms ease, transform 180ms ease;
}

.nav-actions--dimmed {
  opacity: 0.14;
  transform: scale(0.96);
}

.nav-entry { display: flex; flex-direction: column; }
.nav-children { display: flex; flex-direction: column; }
.mobile-nav .nav-children a { padding-left: 32px; font-size: 0.9rem; letter-spacing: 0.06em; }
.mobile-nav .nav-entry:has(.nav-children) > a { font-weight: 800; background: var(--black-08); }
.nav-main .nav-children a { font-size: 1rem; }

.mobile-nav {
  max-height: calc(100dvh - 36px);
  overflow-y: auto;
  z-index: 970;
  pointer-events: auto;
}

.nav-main,
.mobile-nav {
  transition: opacity 180ms ease, transform 180ms ease;
}

.nav-main--dimmed,
.mobile-nav--dimmed {
  opacity: 0.14;
  transform: scale(0.98);
}

.icon-btn {
  position: relative;
  width: 34px;
  height: 34px;
  min-height: 34px;
  flex: 0 0 34px;
  border-radius: 50%;
  background: var(--white);
  box-shadow: 0 2px 10px var(--black-08);
  font-size: 16pt;
}

.icon-btn .bi {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.nav-toggle {
  width: 34px;
  height: 34px;
  min-height: 34px;
  flex: 0 0 34px;
  order: 0;
  background: var(--white);
  box-shadow: 0 2px 10px var(--black-08);
}

.nav-toggle__bar {
  width: 18px;
}

.nav-toggle__bar:nth-child(1) {
  top: 8px;
}

.nav-toggle__bar:nth-child(3) {
  bottom: 8px;
}

@media (max-width: 640px) {
  .nav-actions {
    top: 8px;
    left: 10px;
    border-radius: 999px;
  }
}
</style>
