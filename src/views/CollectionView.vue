<template>
  <section class="products" v-if="page">
    <div class="products-header">
      <div class="product-actions">
        <router-link class="back-link" :to="previousPath">← Previous Collection</router-link>
        <router-link class="btn btn-next" :to="nextPath">Next Collection →</router-link>
        <router-link class="btn btn-browse" to="/collections">Browse All Collections</router-link>
      </div>
      <h2>{{ page.title }}</h2>
      <p>{{ page.description }}</p>
    </div>

    <div class="product-grid">
      <article v-for="product in page.products" :key="product.title" class="product-card">
        <header>
          <h3>{{ product.title }}</h3>
          <div class="product-meta">{{ product.meta }}</div>
          <p>{{ product.description }}</p>
        </header>
        <div class="product-images">
          <div v-for="image in product.images" :key="image" class="placeholder">
            <img :src="image" :alt="product.title" loading="lazy" decoding="async" />
          </div>
        </div>
        <button class="addtocart">Add to Cart</button>
      </article>
    </div>
  </section>
  <section v-else class="not-found">
    <p>Collection not found.</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { collectionPages } from '../data/siteData'

const route = useRoute()

const page = computed(() =>
  collectionPages.find((item) => item.slug === route.params.slug)
)

const previousPath = computed(() => {
  if (!page.value || !page.value.previous) return '/collections'
  return `/collections/${page.value.previous}`
})

const nextPath = computed(() => {
  if (!page.value || !page.value.next) return '/collections'
  return `/collections/${page.value.next}`
})
</script>
