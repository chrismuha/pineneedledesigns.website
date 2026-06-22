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

    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-column">
          <article class="hero-card" aria-label="Hero — Denim & Lace">
            <div class="copy">
              <div class="eyebrow">New Drop</div>
              <h1>Denim & Lace yes please ✨</h1>
              <p>Limited-run upcycled pieces crafted to stand out.</p>
              <div class="cta">
                <router-link class="btn btn-accent" to="/collections/denim-and-lace">Shop Now</router-link>
              </div>
              <div class="hero-placeholder-stack">
                <div class="hero-image-pair">
                  <img loading="eager" decoding="async" class="hero-placeholder-inline hero-placeholder-inline--tall placeholder-image" :src="homePlaceholderImages.denimFeature" />
                  <img loading="eager" decoding="async" class="hero-placeholder-inline hero-placeholder-inline--tall placeholder-image" :src="homePlaceholderImages.denimFeatureAlt" />
                </div>
                <p class="hero-hurry hero-hurry--inline hero-hurry--left">LAST CHANCE, ONCE THEY SELL OUT, THEY ARE GONE FOREVER!</p>
                <div class="hero-image-pair">
                  <img loading="eager" decoding="async" class="hero-card__placeholder placeholder-image" :src="homePlaceholderImages.denimFirstCard" />
                  <img loading="eager" decoding="async" class="hero-card__placeholder placeholder-image" :src="homePlaceholderImages.denimFirstCardAlt" />
                </div>
                <div class="hero-image-pair">
                  <img loading="eager" decoding="async" class="hero-card__placeholder placeholder-image" :src="homePlaceholderImages.denimSecondCard" />
                  <img loading="eager" decoding="async" class="hero-card__placeholder placeholder-image" :src="homePlaceholderImages.denimSecondCardAlt" />
                </div>
              </div>
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
                <div class="hero-image-row">
                  <img loading="lazy" decoding="async" class="hero-2" src="/images/adirondack-chic/seasonal-adirondack-chic/whitechristmasboots.webp" />
                  <img loading="lazy" decoding="async" class="hero-2" src="/images/comingsoon/comingsoon015.webp" />
                </div>
                <p class="hero-hurry hero-hurry--inline">LAST CHANCE, ONCE THEY SELL OUT, THEY ARE GONE FOREVER!</p>
              </div>
            </div>
          </article>

          <article class="limited-run-strip" aria-label="Limited Time Collection">
            <div class="limited-run-copy">
              <div class="eyebrow">Limited Run</div>
              <h2>Limited-Time Collection</h2>
              <p>Small-batch pieces landing here soon.</p>
            </div>
            <div class="limited-run-slider" aria-label="Limited-time image previews">
              <button class="limited-run-control" type="button" aria-label="Previous limited-time image" @click="previousLimitedTimeSlide">
                <i class="bi bi-chevron-left" aria-hidden="true"></i>
              </button>
              <div class="limited-run-main">
                <div class="limited-run-frame" aria-live="polite">
                  <div class="limited-run-placeholder">
                    <span>{{ currentLimitedTimeSlide.label }}</span>
                  </div>
                </div>
                <router-link class="btn btn-accent limited-run-preview" to="/collections/limited-time">Preview</router-link>
                <div class="limited-run-dots" role="tablist" aria-label="Limited-time image navigation">
                  <button
                    v-for="(slide, slideIndex) in limitedTimeSlides"
                    :key="slide.label"
                    type="button"
                    :class="['limited-run-dot', { 'limited-run-dot--active': slideIndex === limitedTimeSlideIndex }]"
                    :aria-label="`Show limited-time image ${slideIndex + 1}`"
                    :aria-selected="slideIndex === limitedTimeSlideIndex"
                    role="tab"
                    @click="setLimitedTimeSlide(slideIndex)"
                  ></button>
                </div>
              </div>
              <button class="limited-run-control" type="button" aria-label="Next limited-time image" @click="nextLimitedTimeSlide">
                <i class="bi bi-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          </article>
        </div>

        <div class="hero-column">
          <article class="hero-card hero-card--new-arrivals" aria-label="New Arrivals">
            <div class="copy">
              <div class="eyebrow">Fresh Picks</div>
              <h2 style="margin:.2rem 0 1rem">New Arrivals</h2>
              <p>Must-haves just in. Find your next statement piece.</p>
              <div class="cta">
                <a class="btn btn-accent" href="https://pineneedledesigns.store" target="_blank" rel="noopener noreferrer">Take me there</a>
              </div>
              <img loading="eager" decoding="async" class="hero-bunny placeholder-image" :src="homePlaceholderImages.newArrivalsFeature" />
              <div class="hero-placeholder-stack">
                <img loading="eager" decoding="async" class="hero-placeholder-inline hero-placeholder-inline--tall placeholder-image" :src="homePlaceholderImages.newArrivalsFirstCard" />
                <img loading="eager" decoding="async" class="hero-placeholder-inline hero-placeholder-inline--tall placeholder-image" :src="homePlaceholderImages.newArrivalsSecondCard" />
              </div>
              <p class="hero-hurry hero-hurry--inline hero-hurry--bunny">LAST CHANCE, ONCE THEY SELL OUT, THEY ARE GONE FOREVER!</p>
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
      </div>
    </section>

    <section>
      <div class="container split shop-split">
        <div class="tile">
          <img loading="lazy" decoding="async" class="placeholder-image" :src="homePlaceholderImages.bottomsTile" />
          <div class="copy">
            <h3>Explore Bottoms</h3>
            <a class="btn btn-accent" href="https://pineneedledesigns.store" target="_blank" rel="noopener noreferrer">Shop now</a>
          </div>
        </div>
        <div class="tile">
          <img loading="lazy" decoding="async" class="placeholder-image" :src="homePlaceholderImages.topsTile" />
          <div class="copy">
            <h3>Explore Tops</h3>
            <a class="btn btn-accent" href="https://pineneedledesigns.store" target="_blank" rel="noopener noreferrer">Shop now</a>
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
import { computed, ref } from 'vue'
import ImageSlider from '../components/ImageSlider.vue'
import { homeSections, otherCollections } from '../data/siteData'
import comingSoon023 from '../../images/comingsoon/comingsoon023.webp'
import comingSoon024 from '../../images/comingsoon/comingsoon024.webp'

const limitedTimeSlides = [
  { label: 'Image 1' },
  { label: 'Image 2' },
  { label: 'Image 3' },
]
const limitedTimeSlideIndex = ref(0)
const currentLimitedTimeSlide = computed(() => limitedTimeSlides[limitedTimeSlideIndex.value])
const setLimitedTimeSlide = (index) => {
  limitedTimeSlideIndex.value = (index + limitedTimeSlides.length) % limitedTimeSlides.length
}
const previousLimitedTimeSlide = () => setLimitedTimeSlide(limitedTimeSlideIndex.value - 1)
const nextLimitedTimeSlide = () => setLimitedTimeSlide(limitedTimeSlideIndex.value + 1)

const homePlaceholderImages = {
  denimFeature: '/images/whimsical-fairy/crownb.webp',
  denimFeatureAlt: '/images/denimlace/brandybracelet/brandybracelet1.webp',
  denimFirstCard: '/images/denimlace/adelinebracelet/adeline-bracelet-1.webp',
  denimFirstCardAlt: '/images/jackets/jacket1a.webp',
  denimSecondCard: '/images/one-offs/jackets/ruby-lee/ruby-lee-1a.webp',
  denimSecondCardAlt: '/images/ear-rings/ear-rings-1a.webp',
  newArrivalsFeature: '/images/upcycled-collaboration/adirondack-chic-leather-cowhide-overnight-duffel-bag/cowhide-bag2.webp',
  newArrivalsFirstCard: '/images/upcycled-collaboration/cowhide-leather-wallet-wristlet/cowhide-wristlet1.webp',
  newArrivalsSecondCard: '/images/upcycled-collaboration/pink-tooled-leather-speedy-bag/pink-tooled-leather-speedy-bag1.webp',
  bottomsTile: comingSoon023,
  topsTile: comingSoon024,
}

const featuredImageLoading = (index) => (index === 0 ? 'eager' : 'lazy')
const featuredImagePriority = (index) => (index === 0 ? 'high' : 'auto')
const collectionImageLoading = (index) => (index < 2 ? 'eager' : 'lazy')
const isComingSoonImage = (src) => String(src).includes('/comingsoon/')
const uppercase = (value) => String(value).toUpperCase()
const itemCountLabel = (count) => `${count} ITEMS`
</script>
