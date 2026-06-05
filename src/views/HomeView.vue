<template>
  <div class="home-page">
    <ImageSlider />

    <section id="about">
      <div class="container">
        <h2 class="section-title">Highlighted Collections</h2>
      </div>

      <div v-for="section in homeSections" :key="section.id" class="container highlighted-collection">
        <div class="section-head">
          <h2>{{ section.title }}</h2>
          <router-link class="link" :to="section.path">Browse Collection</router-link>
        </div>

        <div class="grid grid-4">
          <article v-for="card in section.cards" :key="card.alt + card.pill" class="product card disabled">
            <router-link :to="section.path">
              <img loading="lazy" decoding="async" class="media" :alt="card.alt" :src="card.image" />
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
      </div>
    </section>

    <section class="collections">
      <div class="container">
        <div class="section-head">
          <h2>Other Collection</h2>
          <a class="link" href="#">Browse Collection</a>
        </div>

        <div class="grid grid-6">
          <article
            v-for="collection in otherCollections"
            :key="collection.slug"
            :class="['card', { disabled: collection.count === 0 }]"
          >
            <router-link v-if="collection.count > 0" class="card-link" :to="collection.path">
              <img loading="lazy" class="media" :alt="collection.title" :src="collection.cardImage" />
              <div class="body">
                <h3>{{ collection.title }}</h3>
                <div class="subtle">{{ collection.count }} items</div>
              </div>
            </router-link>
            <div v-else>
              <img loading="lazy" class="media" :alt="collection.title" :src="collection.cardImage" />
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
            <p class="hero-hurry hero-hurry--inline hero-hurry--left">Hurry before they sell out!</p>
            <div class="cta">
              <a class="btn btn-accent" href="https://pineneedledesigns.store">Shop Now</a>
            </div>
            <div class="hero-placeholder-stack">
              <div class="hero-placeholder-inline hero-placeholder-inline--tall"></div>
              <div class="hero-card__placeholder" aria-hidden="true"></div>
              <div class="hero-card__placeholder" aria-hidden="true"></div>
            </div>
          </div>
        </article>

        <article class="hero-card" aria-label="New Arrivals">
          <div class="copy">
            <div class="eyebrow">Fresh Picks</div>
            <h2 style="margin:.2rem 0 1rem">New Arrivals</h2>
            <p>Must-haves just in. Find your next statement piece.</p>
            <div class="cta">
              <a class="btn btn-accent" href="https://pineneedledesigns.store">Take me there</a>
            </div>
            <img loading="lazy" decoding="async" class="hero-bunny" alt="I Hare You" src="/images/bunny.webp" />
            <p class="hero-hurry hero-hurry--inline">Hurry before they sell out!</p>
            <div class="hero-placeholder-stack">
              <div class="hero-placeholder-inline hero-placeholder-inline--tall"></div>
              <div class="hero-placeholder-inline hero-placeholder-inline--tall"></div>
            </div>
          </div>
        </article>

        <article class="hero-card" aria-label="Winter/Spring Picks">
          <div class="copy">
            <div class="eyebrow">Curated</div>
            <h2 style="margin:.2rem 0 1rem">Winter/Spring Favorites</h2>
            <p>Shop the pieces we can't stop thinking about this season.</p>
            <div class="cta">
              <a class="btn btn-accent" href="https://pineneedledesigns.store">Take me there</a>
            </div>
            <div class="hero-images">
              <img loading="lazy" class="hero-2" alt="White Christmas Boots" src="/images/adirondack-chic/seasonal-adirondack-chic/whitechristmasboots.webp" />
            </div>
            <p class="hero-hurry hero-hurry--inline">Hurry before they sell out!</p>
          </div>
        </article>

        <article class="hero-card" aria-label="Summer/Fall Picks">
          <div class="copy">
            <div class="eyebrow">Curated</div>
            <h2 style="margin:.2rem 0 1rem">Summer/Fall Favorites</h2>
            <p>Winter may be here now but order ahead and get discounts when you purchase ahead for the next seasons.</p>
            <div class="cta">
              <a class="btn btn-accent" href="https://pineneedledesigns.store">Take me there</a>
            </div>
            <img loading="lazy" class="hero-3" alt="Coming Soon" src="/images/comingsoon/comingsoon1.webp" />
            <p class="hero-hurry hero-hurry--inline" style="text-align:left;">Hurry before they sell out! You would not want to miss out on the chance at opportunities in life this dress could send to you. Get it now before it is too late; it may not return next season!</p>
          </div>
        </article>
      </div>
    </section>

    <section>
      <div class="container split">
        <div class="tile">
          <img loading="lazy" alt="Selection of bottoms" src="/images/bunny.webp" />
          <div class="copy">
            <h3>Explore Bottoms</h3>
            <a class="btn btn-accent" href="https://pineneedledesigns.store">Shop now</a>
          </div>
        </div>
        <div class="tile">
          <img loading="lazy" alt="Selection of tops" src="/images/bunny.webp" />
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
  </div>
</template>

<script setup>
import ImageSlider from '../components/ImageSlider.vue'
import { homeSections, otherCollections } from '../data/siteData'
</script>
