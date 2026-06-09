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
              <h3>{{ card.title }}</h3>
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
                decoding="async"
                :class="['media', { 'coming-soon-image': isComingSoonImage(collection.cardImage) }]"
                :src="collection.cardImage"
              />
              <div class="body">
                <h3>{{ collection.title }}</h3>
                <div class="subtle">{{ collection.count }} items</div>
              </div>
            </router-link>
            <div v-else>
              <img
                :loading="collectionImageLoading(collectionIndex)"
                decoding="async"
                :class="['media', { 'coming-soon-image': isComingSoonImage(collection.cardImage) }]"
                :src="collection.cardImage"
              />
              <div class="body">
                <h3>{{ collection.title }}</h3>
                <div class="subtle">0 items</div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="hero">
      <div class="container hero-grid">
        <article class="hero-card" aria-label="Hero — Denim & Lace">
          <div class="copy">
            <div class="eyebrow">New Drop</div>
            <h1>Denim & Lace yes please ✨</h1>
            <p>Limited-run upcycled pieces crafted to stand out.</p>
            <div class="cta">
              <router-link class="btn btn-accent" to="/collections/denim-and-lace">Shop Now</router-link>
            </div>
            <div class="hero-placeholder-stack">
              <img loading="lazy" decoding="async" class="hero-placeholder-inline hero-placeholder-inline--tall placeholder-image" :src="homePlaceholderImages.denimFeature" />
              <p class="hero-hurry hero-hurry--inline hero-hurry--left">LAST CHANCE, ONCE THEY SELL OUT, THEY ARE GONE FOREVER!</p>
              <img loading="lazy" decoding="async" class="hero-card__placeholder placeholder-image" :src="homePlaceholderImages.denimFirstCard" />
              <img loading="lazy" decoding="async" class="hero-card__placeholder placeholder-image" :src="homePlaceholderImages.denimSecondCard" />
            </div>
          </div>
        </article>

        <article class="hero-card hero-card--new-arrivals" aria-label="New Arrivals">
          <div class="copy">
            <div class="eyebrow">Fresh Picks</div>
            <h2 style="margin:.2rem 0 1rem">New Arrivals</h2>
            <p>Must-haves just in. Find your next statement piece.</p>
            <div class="cta">
              <a class="btn btn-accent" href="https://pineneedledesigns.store">Take me there</a>
            </div>
            <img loading="lazy" decoding="async" class="hero-bunny placeholder-image" :src="homePlaceholderImages.newArrivalsFeature" />
            <div class="hero-placeholder-stack">
              <img loading="lazy" decoding="async" class="hero-placeholder-inline hero-placeholder-inline--tall placeholder-image" :src="homePlaceholderImages.newArrivalsFirstCard" />
              <img loading="lazy" decoding="async" class="hero-placeholder-inline hero-placeholder-inline--tall placeholder-image" :src="homePlaceholderImages.newArrivalsSecondCard" />
            </div>
            <p class="hero-hurry hero-hurry--inline hero-hurry--bunny">LAST CHANCE, ONCE THEY SELL OUT, THEY ARE GONE FOREVER!</p>
          </div>
        </article>

        <article class="hero-card" aria-label="Winter/Spring Picks">
          <div class="copy">
            <div class="eyebrow">Curated</div>
            <h2 style="margin:.2rem 0 1rem">Winter/Spring Favorites</h2>
            <p>Shop the pieces we can't stop thinking about this season.</p>
            <div class="cta">
              <router-link class="btn btn-accent" to="/collections/winter-spring">Take me there</router-link>
            </div>
            <div class="hero-images hero-images--with-caption hero-images--boots">
              <img loading="lazy" decoding="async" class="hero-2" src="/images/adirondack-chic/seasonal-adirondack-chic/whitechristmasboots.webp" />
              <p class="hero-hurry hero-hurry--inline">LAST CHANCE, ONCE THEY SELL OUT, THEY ARE GONE FOREVER!</p>
            </div>
          </div>
        </article>

        <article class="hero-card" aria-label="Summer/Fall Picks">
          <div class="copy">
            <div class="eyebrow">Curated</div>
            <h2 style="margin:.2rem 0 1rem">Summer/Fall Favorites</h2>
            <p>Winter may be here now but order ahead and get discounts when you purchase ahead for the next seasons.</p>
            <div class="cta">
              <router-link class="btn btn-accent" to="/collections/summer-fall">Take me there</router-link>
            </div>
            <div class="hero-images hero-images--with-caption">
              <img loading="lazy" decoding="async" class="hero-3" src="/images/comingsoon/comingsoon016.webp" />
              <p class="hero-hurry hero-hurry--inline">LAST CHANCE, ONCE THEY SELL OUT, THEY ARE GONE FOREVER!</p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section>
      <div class="container split shop-split">
        <div class="tile">
          <img loading="lazy" decoding="async" class="placeholder-image" :src="homePlaceholderImages.bottomsTile" />
          <div class="copy">
            <h3>Explore Bottoms</h3>
            <a class="btn btn-accent" href="https://pineneedledesigns.store">Shop now</a>
          </div>
        </div>
        <div class="tile">
          <img loading="lazy" decoding="async" class="placeholder-image" :src="homePlaceholderImages.topsTile" />
          <div class="copy">
            <h3>Explore Tops</h3>
            <a class="btn btn-accent" href="https://pineneedledesigns.store">Shop now</a>
          </div>
        </div>
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

    <ImageSlider />
  </div>
</template>

<script setup>
import ImageSlider from '../components/ImageSlider.vue'
import { homeSections, otherCollections } from '../data/siteData'
import comingSoon017 from '../../images/comingsoon/comingsoon017.webp'
import comingSoon018 from '../../images/comingsoon/comingsoon018.webp'
import comingSoon019 from '../../images/comingsoon/comingsoon019.webp'
import comingSoon020 from '../../images/comingsoon/comingsoon020.webp'
import comingSoon021 from '../../images/comingsoon/comingsoon021.webp'
import comingSoon022 from '../../images/comingsoon/comingsoon022.webp'
import comingSoon023 from '../../images/comingsoon/comingsoon023.webp'
import comingSoon024 from '../../images/comingsoon/comingsoon024.webp'

const homePlaceholderImages = {
  denimFeature: comingSoon017,
  denimFirstCard: comingSoon018,
  denimSecondCard: comingSoon019,
  newArrivalsFeature: comingSoon020,
  newArrivalsFirstCard: comingSoon021,
  newArrivalsSecondCard: comingSoon022,
  bottomsTile: comingSoon023,
  topsTile: comingSoon024,
}

const featuredImageLoading = (index) => (index === 0 ? 'eager' : 'lazy')
const featuredImagePriority = (index) => (index === 0 ? 'high' : 'auto')
const collectionImageLoading = (index) => (index < 2 ? 'eager' : 'lazy')
const isComingSoonImage = (src) => String(src).includes('/comingsoon/')
</script>
