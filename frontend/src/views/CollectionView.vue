<template>
  <section v-if="page" class="products">
    <div class="products-header">
      <div class="product-actions">
        <router-link class="back-link" :to="previousPath">← Previous Collection</router-link>
        <router-link class="btn btn-next" :to="nextPath">Next Collection →</router-link>
      </div>
      <h2>{{ page.title }}</h2>
      <p>{{ page.description }}</p>

      <p v-if="subcollectionsError" class="collection-status collection-status--error" role="alert">
        {{ subcollectionsError }}
        <button type="button" class="collection-status__retry" @click="loadSubcollections">Try again</button>
      </p>

      <div
        v-else-if="subcollectionsLoading"
        class="collection-filters collection-filters--loading"
        aria-label="Loading filters/sub-collections"
      >
        <span class="collection-status">Loading filters/sub-collections...</span>
      </div>

      <div
        v-else-if="subcollections.length"
        class="collection-filters"
        :class="{ 'collection-filters--with-bag-types': showBagTypeFilter }"
        aria-label="Filters/Sub-Collections"
      >
        <button
          type="button"
          class="collection-filter collection-filter--filter-all"
          :class="{ 'collection-filter--active': selectedSubcollectionId === null }"
          :aria-pressed="selectedSubcollectionId === null"
          @click="selectSubcollection(null)"
        >
          All
        </button>
        <button
          v-for="subcollection in subcollections"
          :key="subcollection._id"
          type="button"
          class="collection-filter"
          :class="[
            filterClass(subcollection.name),
            { 'collection-filter--active': selectedSubcollectionId === subcollection._id },
          ]"
          :aria-pressed="selectedSubcollectionId === subcollection._id"
          @click="selectSubcollection(subcollection._id)"
        >
          {{ subcollection.name }}
        </button>
        <label v-if="showBagTypeFilter" class="collection-filter-select">
          <span class="visually-hidden">Bag type</span>
          <select v-model="activeBagType">
            <option :value="allBagTypes">Select bag type</option>
            <option v-for="bagType in bagTypeOptions" :key="bagType" :value="bagType">
              {{ bagType }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <p v-if="productsError" class="collection-status collection-status--error" role="alert">
      {{ productsError }}
      <button type="button" class="collection-status__retry" @click="loadProducts(selectedSubcollectionId)">
        Try again
      </button>
    </p>

    <p v-else-if="productsLoading" class="collection-status">Loading products...</p>

    <div v-else-if="filteredProducts.length" class="product-grid">
      <article
        v-for="(product, productIndex) in filteredProducts"
        :id="`product-${product.id}`"
        :key="`${product.id}-${product.title}`"
        class="product-card"
      >
        <header>
          <h3 :ref="productIndex === 0 ? setFirstProductTitle : undefined">
            {{ displayTitle(product) }}
          </h3>
          <div class="product-meta">
            <div v-for="(item, index) in displayProductMeta(product)" :key="index">{{ item }}</div>
            <div v-if="product.maker" class="product-maker">{{ product.maker }}</div>
          </div>
          <div class="product-description">
            <h4>Description</h4>
            <p>{{ displayDescription(product) }}</p>
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
              :label="`${displayTitle(product)} media gallery`"
              :eager="productIndex < 2"
              :priority="productIndex === 0 ? 'high' : 'auto'"
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
        <button v-else-if="isProductSold(product)" class="addtocart" disabled>Sold</button>
        <button v-else-if="Number.isFinite(productPrice(product))" class="addtocart" disabled>Select Options</button>
        <button v-else class="addtocart" disabled>Price TBD</button>
      </article>
    </div>
    <p v-else-if="!productsLoading && !productsError" class="subtle">
      {{ hasLoadedProducts ? 'No matching items' : 'Coming Soon' }}
    </p>
  </section>
  <section v-else class="not-found">
    <p>Collection not found.</p>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import MediaSlider from '../components/MediaSlider.vue'
import ProductOptionSelect from '../components/ProductOptionSelect.vue'
import { catalogApi } from '../api/catalog.js'
import { useCatalogStore } from '../stores/catalog.js'
import { useCartStore } from '../stores/cart'
import { firstVisibleProductMedia, preloadImages, preloadImagesOnIdle } from '../utils/mediaPreloader'

const props = defineProps({
  slug: String,
})

const catalogStore = useCatalogStore()
const cartStore = useCartStore()
const selectedOptions = ref({})
const subcollections = ref([])
const products = ref([])
const selectedSubcollectionId = ref(null)
const subcollectionsLoading = ref(false)
const productsLoading = ref(false)
const subcollectionsError = ref('')
const productsError = ref('')
const hasLoadedProducts = ref(false)
const firstProductTitle = ref(null)
const bagsFilter = 'Bags'
const allBagTypes = 'All'
const activeBagType = ref(allBagTypes)

const page = computed(() => catalogStore.getCollectionBySlug(props.slug))

const previousPath = computed(() => {
  if (!page.value || !page.value.previous) return '/collections'
  return `/collections/${page.value.previous}`
})

const nextPath = computed(() => {
  if (!page.value || !page.value.next) return '/collections'
  return `/collections/${page.value.next}`
})

const selectedSubcollection = computed(() =>
  subcollections.value.find((subcollection) => subcollection._id === selectedSubcollectionId.value) || null)

const filterClass = (filter) =>
  `collection-filter--filter-${String(filter).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

const productBagTypes = (product) =>
  Array.isArray(product.bagTypes) ? product.bagTypes : [product.bagTypes].filter(Boolean)

const bagTypeOptions = computed(() => {
  if (selectedSubcollection.value?.name !== bagsFilter) return []

  return [...new Set(
    products.value.flatMap(productBagTypes).filter(Boolean),
  )].sort((a, b) => a.localeCompare(b))
})

const showBagTypeFilter = computed(() =>
  selectedSubcollection.value?.name === bagsFilter && bagTypeOptions.value.length > 0
)

const filteredProducts = computed(() => {
  if (!showBagTypeFilter.value || activeBagType.value === allBagTypes) {
    return products.value
  }

  return products.value.filter((product) =>
    productBagTypes(product).includes(activeBagType.value))
})

const loadSubcollections = async () => {
  if (!props.slug) return

  subcollectionsLoading.value = true
  subcollectionsError.value = ''

  try {
    subcollections.value = await catalogApi.getSubcollections(props.slug)
  } catch (error) {
    subcollections.value = []
    subcollectionsError.value = error.message || 'Failed to load filters/sub-collections.'
  } finally {
    subcollectionsLoading.value = false
  }
}

const loadProducts = async (subCollectionId = null) => {
  if (!props.slug) return

  productsLoading.value = true
  productsError.value = ''

  try {
    products.value = await catalogApi.getProducts(props.slug, subCollectionId)
    hasLoadedProducts.value = true
    preloadPageMedia(products.value)
  } catch (error) {
    products.value = []
    productsError.value = error.message || 'Failed to load products.'
  } finally {
    productsLoading.value = false
  }
}

const selectSubcollection = async (subCollectionId) => {
  if (selectedSubcollectionId.value === subCollectionId) return

  selectedSubcollectionId.value = subCollectionId
  activeBagType.value = allBagTypes
  await loadProducts(subCollectionId)
}

const loadCollectionData = async () => {
  if (!page.value || !props.slug) {
    subcollections.value = []
    products.value = []
    subcollectionsError.value = ''
    productsError.value = ''
    subcollectionsLoading.value = false
    productsLoading.value = false
    hasLoadedProducts.value = false
    return
  }

  selectedSubcollectionId.value = null
  activeBagType.value = allBagTypes
  hasLoadedProducts.value = false
  products.value = []
  await Promise.all([
    loadSubcollections(),
    loadProducts(null),
  ])

  await nextTick()
  firstProductTitle.value?.scrollIntoView({ block: 'start', behavior: 'instant' })
}

const setFirstProductTitle = (element) => {
  firstProductTitle.value = element
}

const optionKey = (product, option) => `${product.id}-${option.name}`
const styleOptionName = 'Style'
const blingStyle = 'Bling'
const noBlingStyle = 'No Bling'

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

const productMeta = (product) => Array.isArray(product.meta) ? product.meta : [product.meta].filter(Boolean)
const selectedStyle = (product) => selectedOptions.value[optionKey(product, { name: styleOptionName })] || ''
const hasBlingStyleOption = (product) =>
  product.options?.some((option) => option.name === styleOptionName && option.values?.includes(blingStyle))

const cleanNonBlingTitle = (title) =>
  String(title)
    .replace(/\bblinged\s+out\b\s*/gi, '')
    .replace(/\bblinged\b\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()

const displayTitle = (product) => {
  if (!hasBlingStyleOption(product)) return product.title
  if (isNoBlingSelected(product)) return cleanNonBlingTitle(product.title)
  return product.title
}

const isNoBlingSelected = (product) => selectedStyle(product) === noBlingStyle

const productPrice = (product) => {
  if (isNoBlingSelected(product) && Number.isFinite(product.noBlingPrice)) return product.noBlingPrice
  if (selectedStyle(product) === blingStyle && Number.isFinite(product.blingPrice)) return product.blingPrice
  return product.price
}

const displayDescription = (product) => {
  if (isNoBlingSelected(product)) {
    return product.noBlingDescription || `${cleanNonBlingTitle(product.title)} without added bling.`
  }
  return product.description
}

const displayProductMeta = (product) => {
  const meta = productMeta(product)
  const price = productPrice(product)

  if (!Number.isFinite(price)) return meta

  let replacedPrice = false
  return meta.map((item) => {
    if (!replacedPrice && /^price:/i.test(String(item).trim())) {
      replacedPrice = true
      return `Price: $${price}`
    }

    return item
  })
}

const isProductSold = (product) => {
  if (product.sold || product.soldOut) return true
  if (typeof product.status === 'string' && /^sold(?:\s*out)?$/i.test(product.status.trim())) return true
  if (typeof product.availability === 'string' && /^sold(?:\s*out)?$/i.test(product.availability.trim())) return true

  return productMeta(product).some((item) => /^price:\s*sold(?:\s*out)?\b/i.test(String(item).trim()))
}

const canAddToCart = (product) =>
  Number.isFinite(productPrice(product)) && !isProductSold(product) && hasRequiredOptions(product)

const hasMedia = (product) =>
  Boolean((product.images && product.images.length) || (product.videos && product.videos.length))

const videoPosterFor = (product, index) =>
  product.videoPosters?.[index] || product.images?.[0] || ''

const productMedia = (product) => [
  ...(product.images || []).map((src) => ({
    src,
    type: 'image',
  })),
  ...(product.videos || []).map((src, index) => ({
    src,
    type: 'video',
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

const preloadPageMedia = (currentProducts) => {
  const media = currentProducts.flatMap(firstVisibleProductMedia)
  preloadImages(media.slice(0, 2))
  preloadImagesOnIdle(media.slice(2), 2)
}

onMounted(() => {
  loadCollectionData()
})

watch(() => props.slug, () => {
  loadCollectionData()
})

watch(selectedSubcollectionId, () => {
  activeBagType.value = allBagTypes
})

const addToCart = async (product) => {
  if (!canAddToCart(product)) return

  const selectedProduct = {
    ...product,
    title: displayTitle(product),
    price: productPrice(product),
    meta: displayProductMeta(product),
    description: displayDescription(product),
    selectedOptions: productSelections(product),
  }

  selectedProduct.cartItemId = [
    product.id,
    ...Object.entries(selectedProduct.selectedOptions).map(([name, value]) => `${name}:${value}`),
  ].join('|')

  await cartStore.addItem(selectedProduct)
}
</script>

<style scoped>
.collection-status {
  margin: 12px 0 0;
  color: #666;
}

.collection-status--error {
  color: #b42318;
}

.collection-status__retry {
  margin-left: 8px;
  border: 0;
  background: none;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
}

.collection-filters--loading {
  min-height: 42px;
  align-items: center;
}

.product-card:first-child h3 {
  scroll-margin-top: 190px;
}
</style>
