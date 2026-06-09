<template>
  <section class="collections collections-catalog">
    <div class="container">
      <div class="section-head collections-page-header">
        <h1>Browse All Collections</h1>
      </div>

      <section v-for="(group, groupIndex) in collectionGroups" :key="group.title" class="collection-group">
        <h3>{{ group.title }}</h3>
        <div class="grid grid-4 collection-list">
          <article v-for="(collection, collectionIndex) in group.collections" :key="collection.slug" class="card collection-card">
            <router-link class="collection-link" :to="collection.path">
              <img
                class="collection-card__image"
                :src="collection.cardImage"
                :loading="collectionImageLoading(groupIndex, collectionIndex)"
                :fetchpriority="collectionImagePriority(groupIndex, collectionIndex)"
                decoding="async"
              />
              <div class="body">
                <h4>{{ collection.title }}</h4>
                <div class="subtle">{{ collection.count }} items</div>
              </div>
            </router-link>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { visibleCollectionPages } from '../data/siteData'

const categoryOrder = [
  {
    title: 'Clothing Collections',
    slugs: ['jackets', 'shirts', 'vests', 'jeans', 'shorts', 'upcycled-collaboration', 'upcycled-logo', 'upcycled-denim'],
  },
  {
    title: 'Jewelry & Accessories',
    slugs: ['earrings', 'necklaces', 'bracelets', 'cuffs', 'hat-bands', 'boot-bands', 'purses'],
  },
  {
    title: 'Specialty Collections',
    slugs: ['adirondack-bridal', 'adirondack-chic', 'pooch-smooches', 'chic-jewelry'],
  },
]

const visibleBySlug = new Map(visibleCollectionPages.map((collection) => [collection.slug, collection]))
const groupedSlugs = new Set(categoryOrder.flatMap((group) => group.slugs))

const collectionGroups = [
  ...categoryOrder.map((group) => ({
    title: group.title,
    collections: group.slugs.map((slug) => visibleBySlug.get(slug)).filter(Boolean),
  })),
  {
    title: 'Other Collections',
    collections: visibleCollectionPages.filter((collection) => !groupedSlugs.has(collection.slug)),
  },
].filter((group) => group.collections.length > 0)

const collectionImageLoading = (groupIndex, collectionIndex) =>
  groupIndex === 0 && collectionIndex < 4 ? 'eager' : 'lazy'

const collectionImagePriority = (groupIndex, collectionIndex) =>
  groupIndex === 0 && collectionIndex === 0 ? 'high' : 'auto'
</script>
