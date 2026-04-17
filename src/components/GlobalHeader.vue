<template>
  <header>
    <div class="container nav" role="navigation" aria-label="Primary">
      <div class="brand">
        <div class="brand-logos" role="presentation">
          <router-link to="/" aria-label="Pine Needle Designs home">
            <img src="/images/1a.webp" alt="Pine Needle Designs Logo" width="250" height="250" loading="eager" fetchpriority="high" decoding="async" />
          </router-link>
          <span class="brand-divider" aria-hidden="true"></span>
          <router-link to="/" aria-label="Pine Needle Designs secondary home logo">
            <img src="/images/4.webp" alt="Pine Needle Designs secondary logo" width="250" height="250" loading="eager" fetchpriority="high" decoding="async" />
          </router-link>
        </div>
      </div>

      <div class="nav-actions">
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

        <div class="nav-aux">
          <a class="icon-btn" href="#" aria-label="Wishlist"><i class="bi bi-heart"></i></a>
          <a class="icon-btn" href="#" aria-label="Cart"><i class="bi bi-bag"></i></a>
        </div>
      </div>
    </div>

    <nav class="nav-main" aria-label="Main">
      <router-link v-for="link in navLinks" :key="link.path" :to="link.path" active-class="active">{{ link.label }}</router-link>
    </nav>

    <nav id="mnav" class="mobile-nav" aria-label="Mobile menu" :class="{ 'mobile-nav--open': menuOpen }">
      <router-link v-for="link in navLinks" :key="link.path" :to="link.path" @click="closeMenu" active-class="active">{{ link.label }}</router-link>
    </nav>

    <div class="shop-now-banner">
      <a class="btn btn-accent" href="https://pineneedledesigns.store">Shop Now</a>
      <div class="booking-banner">
        <h2 class="booking-banner__title">Bookings</h2>
        <div class="booking-banner__actions">
          <a class="btn btn-accent" href="https://calendar.app.google/NU1nzMP69Vjz7JU4A">First Fitting</a>
          <a class="btn btn-accent" href="https://calendar.app.google/EU8HAuemRhmr4zBY6">Brides</a>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { navLinks } from '../data/siteData'

const menuOpen = ref(false)
const route = useRoute()

const closeMenu = () => {
  menuOpen.value = false
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
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
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

watch(
  () => route.path,
  () => {
    closeMenu()
  }
)
</script>
