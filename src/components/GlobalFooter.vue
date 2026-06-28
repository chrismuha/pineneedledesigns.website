<template>
  <footer>
    <div class="footer-actions" :class="{ 'footer-actions--dimmed': chromeDimmed }" aria-label="Shop and booking links">
      <router-link
        to="/collections"
        aria-label="Shop all collections"
        :class="{ active: route.path.startsWith('/collections') }"
      >
        <i class="bi bi-shop" aria-hidden="true"></i>
        <span>Shop</span>
      </router-link>
      <router-link to="/booking/fitting">
        <i class="bi bi-calendar-heart" aria-hidden="true"></i>
        <span>Fitting</span>
      </router-link>
      <router-link to="/booking/brides">
        <i class="bi bi-gem" aria-hidden="true"></i>
        <span>Brides</span>
      </router-link>
      <a href="https://calendar.app.google/CJqD3qRvcjUuq2HB7" target="_blank" rel="noopener noreferrer">
        <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
        <span>Repeat Customers</span>
      </a>
    </div>

    <section id="foot-section-1" class="footer-section">
      <div class="container foot-toggle-wrap">
        <p class="toggle-label" id="toggle-about-label">OH BEAUTIFUL YOU.......AND ME TOO!</p>
        <button
          class="foot-toggle icon-plusminus"
          type="button"
          @click="toggle('about')"
          :aria-expanded="String(expanded.about)"
          aria-controls="foot-about"
          aria-labelledby="toggle-about-label"
        >
          <span class="sr-only">Expand Section</span>
        </button>
      </div>

      <div
        id="foot-about"
        class="container footer-grid collapsible"
        :data-collapsed="String(!expanded.about)"
        :aria-hidden="String(!expanded.about)"
        role="region"
        aria-label="About Pine Needle Designs"
      >
        <div class="footer-left">
          <p class="hare">OH BEAUTIFUL YOU.......AND ME TOO!</p>
          <img loading="lazy" decoding="async" class="bunny-image" src="/images/bunny.webp" />
        </div>

        <div class="footer-right">
          <div class="footer-brand">
            <h4 class="footer-brand__title">Pine Needle Designs</h4>
            <p class="footer-brand__tagline">Refashioned clothing & accessories with a boho-meets-chic point of view.</p>
          </div>

          <p class="special-footer-p">
            Pine Needle Designs is an exclusive collection of refashioned clothing and accessories transforming the mundane to Artful Expression. AND Yes, all sizes! A little BOHO, a little Country, a lot of Chic. Could be hippy. (Peace) More upscale AND trendy for sure! My designs are unique and will give you Confidence, Compliments, and scream Country Couture.<br />Designed and made in the USA
          </p>
        </div>
      </div>
    </section>

    <section id="foot-section-2" class="footer-section">
      <div class="container foot-toggle-wrap">
        <p class="toggle-label" id="toggle-links-label">WHAT YOU NEED TO KNOW....hmmm</p>
        <button
          class="foot-toggle icon-plusminus"
          type="button"
          @click="toggle('links')"
          :aria-expanded="String(expanded.links)"
          aria-controls="foot-links"
          aria-labelledby="toggle-links-label"
        >
          <span class="sr-only">Expand Section</span>
        </button>
      </div>

      <div
        id="foot-links"
        class="container collapsible"
        :data-collapsed="String(!expanded.links)"
        :aria-hidden="String(!expanded.links)"
        role="region"
        aria-label="Footer links"
      >
        <div class="foot-links">
          <div class="foot-col">
            <h4>Help</h4>
            <ul>
              <li><router-link to="/privacy-policy">Privacy Policy</router-link></li>
              <li><router-link to="/refund-policy">Refund Policy</router-link></li>
              <li><router-link to="/shipping-policy">Shipping Policy</router-link></li>
              <li><router-link to="/terms-of-service">Terms of Service</router-link></li>
            </ul>
          </div>
          <div class="foot-col">
            <h4>Company</h4>
            <ul>
              <li><router-link to="/about">About</router-link></li>
              <li><router-link to="/collections">Collections</router-link></li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <div class="container footer-qr">
      <a class="qr-link" href="https://pineneedledesigns.store" target="_blank" rel="noopener noreferrer">
        <img loading="lazy" decoding="async" src="/images/1b.webp" width="250" height="250" />
        <span>One-of-a-kind Designs</span>
      </a>
    </div>

    <div class="container copyright" role="contentinfo" style="text-align:center">
      <span>© 2025 Pine Needle Designs <br /> All Rights Reserved.</span>
    </div>
  </footer>
</template>

<script setup>
import { reactive } from 'vue'
import { useRoute } from 'vue-router'

defineProps({
  chromeDimmed: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()

const expanded = reactive({
  about: false,
  links: false,
})

const toggle = (id) => {
  expanded[id] = !expanded[id]
}
</script>
