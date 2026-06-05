<template>
  <section class="image-slider" aria-label="Featured images">
    <button class="slider-btn prev-btn" @click="prevSlide">←</button>

    <div id="slider-container" :class="slideClass">
      <div v-for="src in currentSlide.images" :key="src" class="slide-item">
        <img :src="src" :alt="currentSlide.alt" loading="lazy" decoding="async" />
      </div>
    </div>

    <button class="slider-btn next-btn" @click="nextSlide">→</button>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { sliderSlides } from '../data/siteData'

const currentIndex = ref(0)
const currentSlide = computed(() => sliderSlides[currentIndex.value])
const slideClass = computed(() => {
  const count = currentSlide.value.images.length
  if (count === 1) return 'single'
  if (count === 2) return 'double'
  return 'triple'
})

const showSlide = (index) => {
  currentIndex.value = (index + sliderSlides.length) % sliderSlides.length
}

const nextSlide = () => {
  showSlide(currentIndex.value + 1)
}

const prevSlide = () => {
  showSlide(currentIndex.value - 1)
}

let interval
const startAutoSlide = () => {
  interval = setInterval(nextSlide, 5000)
}
const resetInterval = () => {
  clearInterval(interval)
  startAutoSlide()
}

onMounted(() => {
  startAutoSlide()
})

onBeforeUnmount(() => {
  clearInterval(interval)
})
</script>
