<template>
  <section class="products" v-if="page">
    <div class="products-header">
      <div class="product-actions">
        <router-link class="back-link" :to="previousPath">← Previous Collection</router-link>
        <router-link class="btn btn-next" :to="nextPath">Next Collection →</router-link>
      </div>
      <h2>{{ page.title }}</h2>
      <p>{{ page.description }}</p>
    </div>

    <div v-if="page.products.length" class="product-grid">
      <article v-for="product in page.products" :key="product.title" class="product-card">
        <header>
          <h3>{{ product.title }}</h3>
          <div class="product-meta">
            <template v-if="Array.isArray(product.meta)">
              <div v-for="(item, index) in product.meta" :key="index">{{ item }}</div>
            </template>
            <template v-else>
              {{ product.meta }}
            </template>
          </div>
          <div class="product-description">
            <h4>Description</h4>
            <p>{{ product.description }}</p>
          </div>
        </header>
        <div v-if="product.options && product.options.length" class="product-options">
          <ProductOptionSelect
            v-for="option in product.options"
            :key="`${product.id}-${option.name}`"
            v-model="selectedOptions[optionKey(product, option)]"
            :label="option.name"
            :options="option.values"
            :placeholder="option.placeholder"
          />
        </div>
        <div class="product-images">
          <template v-if="hasMedia(product)">
            <template v-if="product.images && product.images.length">
              <div v-for="image in product.images" :key="image" :class="product.imageWrapper || 'image-frame'">
                <img
                  :src="image"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </template>
            <template v-if="product.videos && product.videos.length">
              <div v-for="video in product.videos" :key="video" :class="product.imageWrapper || 'image-frame'">
                <video
                  :src="video"
                  :aria-label="product.title"
                  controls
                  muted
                  playsinline
                  preload="metadata"
                ></video>
              </div>
            </template>
          </template>
          <template v-else>
            <div
              v-for="(placeholder, index) in product.imagePlaceholders || Array(product.imageCount || 2).fill('')"
              :key="index"
              :class="product.imageWrapper || 'placeholder'"
            >
                <img
                  class="placeholder-image"
                  :src="placeholderImageFor(product, index)"
                  loading="lazy"
                  decoding="async"
                />
            </div>
          </template>
        </div>
        <button v-if="canAddToCart(product)" class="addtocart" @click="addToCart(product)">Add to Cart</button>
        <button v-else-if="Number.isFinite(product.price)" class="addtocart" disabled>Select Options</button>
        <button v-else class="addtocart" disabled>Price TBD</button>
      </article>
    </div>
    <p v-else class="subtle">Coming Soon</p>
  </section>
  <section v-else class="not-found">
    <p>Collection not found.</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import ProductOptionSelect from '../components/ProductOptionSelect.vue'
import { collectionPages } from '../data/siteData'
import { useCartStore } from '../stores/cart'

const props = defineProps({
  slug: String,
})

const route = useRoute()
const cartStore = useCartStore()
const selectedOptions = ref({})

const page = computed(() =>
  collectionPages.find((item) => item.slug === props.slug)
)

const previousPath = computed(() => {
  if (!page.value || !page.value.previous) return '/collections'
  return `/collections/${page.value.previous}`
})

const nextPath = computed(() => {
  if (!page.value || !page.value.next) return '/collections'
  return `/collections/${page.value.next}`
})

const optionKey = (product, option) => `${product.id}-${option.name}`
const productSelections = (product) => {
  if (!product.options || !product.options.length) return {}

  return product.options.reduce((options, option) => {
    options[option.name] = selectedOptions.value[optionKey(product, option)] || ''
    return options
  }, {})
}

const hasRequiredOptions = (product) => {
  if (!product.options || !product.options.length) return true
  return product.options.every((option) => Boolean(selectedOptions.value[optionKey(product, option)]))
}

const canAddToCart = (product) => Number.isFinite(product.price) && hasRequiredOptions(product)
const hasMedia = (product) =>
  Boolean((product.images && product.images.length) || (product.videos && product.videos.length))
const defaultPlaceholderImage = '/images/comingsoon/comingsoon1.webp'
const placeholderImageFor = (product, index) =>
  product.placeholderImages?.[index] || product.placeholderImage || defaultPlaceholderImage

const addToCart = async (product) => {
  const selectedProduct = {
    ...product,
    selectedOptions: productSelections(product),
  }

  selectedProduct.cartItemId = [
    product.id,
    ...Object.entries(selectedProduct.selectedOptions).map(([name, value]) => `${name}:${value}`),
  ].join('|')

  await cartStore.addItem(selectedProduct)
}
</script>
