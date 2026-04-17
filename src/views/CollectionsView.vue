<template>
  <section class="collections">
    <div class="container">
      <div class="section-head">
        <h2>Browse all collections</h2>
      </div>

      <div class="grid grid-4 collection-list">
        <article v-for="collection in collectionPages" :key="collection.slug" class="card collection-card">
          <router-link class="collection-link" :to="collection.path">
            <img :src="collection.cardImage" loading="lazy" decoding="async" class="media" :alt="collection.title" />
            <div class="body">
              <h3>{{ collection.title }}</h3>
              <div class="subtle">{{ collection.count }} items</div>
            </div>
          </router-link>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { collectionPages } from '../data/siteData'
</script>
