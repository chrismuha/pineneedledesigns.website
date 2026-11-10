<template>
  <section class="collections collections-catalog">
    <div class="container">
      <div class="section-head collections-page-header">
        <h1>{{ categoryTitle || 'Shop by Category' }}</h1>
        <router-link v-if="category" to="/collections">Browse All Collections</router-link>
      </div>

      <p class="catalog-guidance">{{ category ? 'Choose a collection below, then use its filters to narrow your choices.' : 'Choose what you’re shopping for, then explore its collections and filters.' }}</p>

      <section v-for="(group, groupIndex) in collectionGroups" :key="group.title" class="collection-group">

        <div class="grid grid-4 collection-list">
          <article v-for="(collection, collectionIndex) in group.collections" :key="collection.slug" class="card collection-card">
            <router-link class="collection-link" :to="collection.path">
              <img
                :class="['collection-card__image', { 'coming-soon-image': isComingSoonImage(collection.cardImage) }]"
                :src="collection.cardImage || '/images/comingsoon/comingsoon015.webp'"
                :alt="collection.title"
                :loading="collectionImageLoading(groupIndex, collectionIndex)"
                :fetchpriority="collectionImagePriority(groupIndex, collectionIndex)"
                decoding="async"
              />
              <div class="body">
                <h4>{{ uppercase(collection.title) }}</h4>
                <p v-if="collection.summary" class="catalog-summary">{{ collection.summary }}</p>
                <div class="subtle">{{ collection.count ? itemCountLabel(collection.count) : 'Coming Soon' }}</div>
              </div>
            </router-link>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useCatalogStore } from '../stores/catalog.js'
import { buildCatalogSections, buildCollectionGroups, collectionCategoryOrder } from '../data/collectionCategoryOrder.js'
import { preloadImages, preloadImagesOnIdle } from '../utils/mediaPreloader'

const catalogStore = useCatalogStore()

const props = defineProps({ category: String })
const categoryTitle = computed(() => collectionCategoryOrder.find((group) => group.slug === props.category)?.title)
const collectionGroups = computed(() => props.category
  ? buildCollectionGroups(catalogStore.collectionPages).filter((group) => group.slug === props.category)
  : [{ title: 'Shop by Category', collections: buildCatalogSections(catalogStore.collectionPages) }])

const collectionImageLoading = (groupIndex, collectionIndex) =>
  groupIndex === 0 && collectionIndex < 4 ? 'eager' : 'lazy'

const collectionImagePriority = (groupIndex, collectionIndex) =>
  groupIndex === 0 && collectionIndex === 0 ? 'high' : 'auto'

const isComingSoonImage = (src) => !src || String(src).includes('/comingsoon/')
const uppercase = (value) => String(value).toUpperCase()
const itemCountLabel = (count) => `${count} ITEMS`

onMounted(() => {
  const visibleImages = collectionGroups.value.flatMap((group) =>
    group.collections.map((collection) => collection.cardImage)
  )

  preloadImages(visibleImages.slice(0, 4))
  preloadImagesOnIdle(visibleImages.slice(4), 3)
})
</script>

<style scoped>
.catalog-guidance { margin: 0 0 24px; line-height: 1.6; }
.catalog-summary { margin: 8px 0 12px; line-height: 1.5; }
</style>
