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
      <article v-for="(product, productIndex) in page.products" :key="product.title" class="product-card">
        <header>
          <h3>{{ product.title }}</h3>
          <div class="product-meta">
            <template v-if="Array.isArray(product.meta)">
              <div v-for="(item, index) in product.meta" :key="index">{{ item }}</div>
            </template>
            <template v-else>
              {{ product.meta }}
            </template>
            <div v-if="product.maker" class="product-maker">{{ product.maker }}</div>
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
            <MediaSlider
              :media="productMedia(product)"
              :label="`${product.title} media gallery`"
            />
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
                  :loading="placeholderImageLoading(productIndex, index)"
                  :fetchpriority="placeholderImagePriority(productIndex, index)"
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
import MediaSlider from '../components/MediaSlider.vue'
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
const videoPosterFor = (product, index) =>
  product.videoPosters?.[index] || product.images?.[0] || ''
const productMedia = (product) => [
  ...(product.images || []).map((src) => ({
    src,
    type: 'image',
    alt: product.title,
  })),
  ...(product.videos || []).map((src, index) => ({
    src,
    type: 'video',
    alt: product.title,
    poster: videoPosterFor(product, index),
  })),
]
const defaultPlaceholderImage = '/images/comingsoon/comingsoon015.webp'
const placeholderImageFor = (product, index) =>
  product.placeholderImages?.[index] || product.placeholderImage || defaultPlaceholderImage
const placeholderImageLoading = (productIndex, imageIndex) =>
  productIndex === 0 && imageIndex === 0 ? 'eager' : 'lazy'
const placeholderImagePriority = (productIndex, imageIndex) =>
  productIndex === 0 && imageIndex === 0 ? 'high' : 'auto'

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
