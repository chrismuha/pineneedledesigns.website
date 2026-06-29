<template>
  <div class="home-page">
    <section v-if="homeSections.length" id="about">
      <div class="container">
        <h2 class="section-title">Highlighted Collections</h2>
      </div>

      <div v-for="section in homeSections" :key="section.id" class="container highlighted-collection">
        <div class="section-head">
          <h2>{{ section.title }}</h2>
          <router-link class="link" :to="section.path">Browse All Collections</router-link>
        </div>

        <div v-if="section.cards.length" class="grid grid-4">
          <article v-for="(card, cardIndex) in section.cards" :key="card.title + card.pill" class="product card disabled">
            <router-link :to="section.path">
              <img
                :loading="featuredImageLoading(cardIndex)"
                :fetchpriority="featuredImagePriority(cardIndex)"
                decoding="async"
                class="media"
                :src="card.image"
              />
            </router-link>
            <div class="body">
              <div class="pill">{{ card.pill }}</div>
              <h3>{{ uppercase(card.title) }}</h3>
              <div class="product-meta"><span>{{ card.meta }}</span></div>
              <div class="price">{{ card.price }}</div>
              <div class="description">{{ card.description }}</div>
            </div>
          </article>
        </div>
        <p v-else class="subtle">Coming Soon</p>
      </div>
    </section>

    <section class="collections">
      <div class="container">
        <div class="section-head">
          <h2>Other Collections</h2>
        </div>

        <div class="grid grid-6">
          <article
            v-for="(collection, collectionIndex) in otherCollections"
            :key="collection.slug"
            :class="['card', { disabled: collection.count === 0 }]"
          >
            <router-link v-if="collection.count > 0" class="card-link" :to="collection.path">
              <img
                :loading="collectionImageLoading(collectionIndex)"
                :fetchpriority="collectionImagePriority(collectionIndex)"
                decoding="async"
                :class="['media', { 'coming-soon-image': isComingSoonImage(collection.cardImage) }]"
                :src="collection.cardImage"
              />
              <div class="body">
                <h3>{{ uppercase(collection.title) }}</h3>
                <div class="subtle">{{ itemCountLabel(collection.count) }}</div>
              </div>
            </router-link>
            <div v-else>
              <img
                :loading="collectionImageLoading(collectionIndex)"
                :fetchpriority="collectionImagePriority(collectionIndex)"
                decoding="async"
                :class="['media', { 'coming-soon-image': isComingSoonImage(collection.cardImage) }]"
                :src="collection.cardImage"
              />
              <div class="body">
                <h3>{{ uppercase(collection.title) }}</h3>
                <div class="subtle">{{ itemCountLabel(0) }}</div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="home-product-collections" aria-labelledby="shop-real-collections-title">
      <div class="container">
        <div class="section-head home-product-collections__heading">
          <div>
            <p class="eyebrow">Shop the actual pieces</p>
            <h2 id="shop-real-collections-title">Featured Products</h2>
          </div>
          <p>Use the arrows to browse. Select any piece to see its full details.</p>
        </div>

        <CollectionProductSlider
          v-for="collection in featuredProductCollections"
          :key="collection.slug"
          :collection="collection"
        />
      </div>
    </section>

    <section>
      <div class="container about">
        <div class="card">
          <h2>One-of-a-kind designs</h2>
          <p>From purses and bracelets to denim jackets with detachable trains, every piece is designed to make a statement. The vibe blends a little boho, a little country, and a whole lot of chic—crafted in the USA and made for all sizes.</p>
          <router-link class="btn" to="/about">About Us</router-link>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import CollectionProductSlider from '../components/CollectionProductSlider.vue'
import { collectionPages, homeSections, otherCollections } from '../data/siteData'
import { preloadImages, preloadImagesOnIdle } from '../utils/mediaPreloader'

const featuredCollectionSlugs = [
  'shirts',
  'jackets',
  'upcycled-logo',
  'upcycled-collaboration',
  'denim-and-lace',
]
const featuredProductCollections = featuredCollectionSlugs
  .map((slug) => collectionPages.find((collection) => collection.slug === slug))
  .filter((collection) => collection?.products.some((product) => !product.placeholder && product.images?.length))

const featuredImageLoading = (index) => (index === 0 ? 'eager' : 'lazy')
const featuredImagePriority = (index) => (index === 0 ? 'high' : 'auto')
const collectionImageLoading = (index) => (index < 2 ? 'eager' : 'lazy')
const collectionImagePriority = (index) => (index === 0 ? 'high' : 'auto')
const isComingSoonImage = (src) => String(src).includes('/comingsoon/')
const uppercase = (value) => String(value).toUpperCase()
const itemCountLabel = (count) => `${count} ITEMS`

onMounted(() => {
  const visibleImages = otherCollections.map((collection) => collection.cardImage)
  preloadImages(visibleImages.slice(0, 4))
  preloadImagesOnIdle(visibleImages.slice(4), 3)
})
</script>

<style scoped>
.home-product-collections {
  padding: 60px 0 80px;
  background: linear-gradient(180deg, var(--pale-blue-2), var(--page-bg));
}

.home-product-collections__heading {
  align-items: end;
  gap: 24px;
}

.home-product-collections__heading h2,
.home-product-collections__heading p {
  margin: 0;
}

.home-product-collections__heading > p {
  max-width: 460px;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .home-product-collections {
    padding: 42px 0 56px;
  }

  .home-product-collections__heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
