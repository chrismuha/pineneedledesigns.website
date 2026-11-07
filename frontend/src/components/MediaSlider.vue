<template>
  <section
    class="media-slider"
    :class="{ 'media-slider--with-controls': showControls }"
    :aria-label="label"
    tabindex="0"
    @keydown.left.prevent="previous"
    @keydown.right.prevent="next"
  >
    <div
      class="media-slider__viewport"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="cancelDrag"
      @pointerleave="cancelDrag"
      @wheel="wheel"
      @click.capture="clickCapture"
    >
      <div
        class="media-slider__track"
        :style="trackStyle"
        :class="{ 'media-slider__track--dragging': isDragging }"
      >
        <div
          v-for="(item, index) in normalizedMedia"
          :key="`${item.src}-${index}`"
          class="media-slider__slide"
          :aria-hidden="index !== currentIndex"
        >
          <video
            v-if="item.type === 'video' && shouldLoad(index)"
            class="media-slider__media"
            :src="item.src"
            :poster="item.poster"
            :aria-label="label"
            controls
            muted
            playsinline
            :preload="index === currentIndex ? 'metadata' : 'none'"
          ></video>
          <img
            v-else-if="shouldLoad(index)"
            class="media-slider__media"
            :src="item.src"
            :loading="imageLoading(index)"
            :fetchpriority="imagePriority(index)"
            decoding="async"
            draggable="false"
          />
          <div
            v-else
            class="media-slider__placeholder"
            aria-hidden="true"
          ></div>
        </div>
      </div>
    </div>

    <button
      v-if="showControls"
      class="media-slider__button media-slider__button--previous"
      type="button"
      :aria-label="`Previous ${mediaTypeLabel}`"
      @click="previous"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
    </button>
    <button
      v-if="showControls"
      class="media-slider__button media-slider__button--next"
      type="button"
      :aria-label="`Next ${mediaTypeLabel}`"
      @click="next"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
    </button>

    <div v-if="showDots" class="media-slider__dots" role="tablist" :aria-label="`${label} navigation`">
      <button
        v-for="(item, index) in normalizedMedia"
        :key="`dot-${item.src}-${index}`"
        class="media-slider__dot"
        :class="{ 'media-slider__dot--active': index === currentIndex }"
        type="button"
        role="tab"
        :aria-selected="index === currentIndex"
        :aria-label="`Show ${mediaTypeLabel} ${index + 1}`"
        @click="goTo(index)"
      ></button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useSliderGestures } from '../composables/useSliderGestures'

const props = defineProps({
  media: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: 'Media gallery',
  },
  eager: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    default: 'auto',
  },
})

const currentIndex = ref(0)
const loadedIndexes = ref(new Set([0]))
const preloadedSources = new Set()

const imageExtensions = ['avif', 'gif', 'jpeg', 'jpg', 'png', 'webp']
const videoExtensions = ['mp4', 'mov', 'ogg', 'webm']

const extensionFor = (src) => {
  const path = String(src).split('?')[0].split('#')[0]
  return path.includes('.') ? path.split('.').pop().toLowerCase() : ''
}

const typeFor = (item) => {
  if (item.type) return item.type

  const extension = extensionFor(item.src || item)
  if (videoExtensions.includes(extension)) return 'video'
  if (imageExtensions.includes(extension)) return 'image'
  return 'image'
}

const normalizedMedia = computed(() =>
  props.media
    .map((item) => {
      if (typeof item === 'string') {
        return {
          src: item,
          type: typeFor(item),
          poster: '',
        }
      }

      return {
        src: item.src,
        type: typeFor(item),
        poster: item.poster || '',
      }
    })
    .filter((item) => item.src)
)

const mediaCount = computed(() => normalizedMedia.value.length)
const showControls = computed(() => mediaCount.value > 1)
const showDots = computed(() => mediaCount.value > 1)
const mediaTypeLabel = computed(() => 'media item')
const trackStyle = computed(() => ({
  transform: `translateX(calc(-${currentIndex.value * 100}% + ${dragOffsetX.value}px))`,
}))

const queueNearbyMedia = (index) => {
  if (!mediaCount.value) return

  const nextIndexes = new Set(loadedIndexes.value)
  nextIndexes.add(index)
  nextIndexes.add((index + 1) % mediaCount.value)
  nextIndexes.add((index - 1 + mediaCount.value) % mediaCount.value)
  loadedIndexes.value = nextIndexes
  preloadImages([...nextIndexes])
}

const shouldLoad = (index) => loadedIndexes.value.has(index)
const imageLoading = (index) => props.eager && index === currentIndex.value ? 'eager' : 'lazy'
const imagePriority = (index) => index === currentIndex.value ? props.priority : 'low'

const preloadSource = (src) => {
  if (!src || preloadedSources.has(src) || typeof Image === 'undefined') return

  preloadedSources.add(src)
  const image = new Image()
  image.decoding = 'async'
  image.loading = 'eager'
  image.src = src
  image.decode?.().catch(() => {})
}

const preloadImage = (item) => {
  if (!item) return
  if (item.type === 'image') preloadSource(item.src)
  if (item.type === 'video') preloadSource(item.poster)
}

const preloadImages = (indexes) => {
  indexes.forEach((index) => {
    preloadImage(normalizedMedia.value[index])
  })
}

watch(
  currentIndex,
  (index) => {
    queueNearbyMedia(index)
  },
  { immediate: true }
)

watch(
  normalizedMedia,
  () => {
    if (typeof window === 'undefined') return
    queueNearbyMedia(currentIndex.value)
  },
  { immediate: true }
)

const goTo = (index) => {
  if (!mediaCount.value) return
  currentIndex.value = (index + mediaCount.value) % mediaCount.value
}

const next = () => {
  goTo(currentIndex.value + 1)
}

const previous = () => {
  goTo(currentIndex.value - 1)
}

const {
  isDragging,
  dragOffsetX,
  pointerDown: startDrag,
  pointerMove: moveDrag,
  pointerUp: endDrag,
  pointerCancel: cancelDrag,
  wheel,
  clickCapture,
} = useSliderGestures({ next, previous, enabled: () => showControls.value })

</script>

<style scoped>
.media-slider {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  border-radius: 16px;
  background: transparent;
  overflow: hidden;
  touch-action: pan-y;
}

.media-slider--with-controls { padding-inline: 82px; }

.media-slider:focus-visible {
  outline: 3px solid var(--brand-red-45);
  outline-offset: 4px;
}

.media-slider__viewport {
  border-radius: 16px;
  background: linear-gradient(180deg, var(--muted), var(--soft-ink));
  width: 100%;
  overflow: hidden;
  cursor: grab;
}

.media-slider__viewport:active {
  cursor: grabbing;
}

.media-slider__track {
  display: flex;
  transition: transform 220ms ease;
  will-change: transform;
}

.media-slider__track--dragging {
  transition: none;
}

.media-slider__slide {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 100%;
  aspect-ratio: 4 / 5;
  min-width: 0;
}

.media-slider__media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}

.media-slider__placeholder {
  width: 100%;
  height: 100%;
}

.media-slider__button {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  padding: 0;
  border: 2px solid var(--white);
  border-radius: 50%;
  background: #165f3d;
  color: var(--white);
  box-shadow: 0 4px 14px #00000040;
  cursor: pointer;
  transform: translateY(-50%);
  appearance: none;
  transition: background 160ms ease, box-shadow 160ms ease;
}

.media-slider__button svg { width: 32px; height: 32px; }

.media-slider__button:hover {
  background: #0c422b;
  box-shadow: 0 6px 18px #00000055;
}

.media-slider__button:focus-visible {
  outline: 3px solid var(--brand-red-45);
  outline-offset: 3px;
}

.media-slider__button--previous {
  left: 0;
}

.media-slider__button--next {
  right: 0;
}

.media-slider__dots {
  position: absolute;
  right: 94px;
  bottom: 12px;
  left: 94px;
  z-index: 2;
  display: flex;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

.media-slider__dot {
  width: 9px;
  height: 9px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--white-60);
  cursor: pointer;
  pointer-events: auto;
}

.media-slider__dot--active {
  background: var(--accent);
}

.media-slider__dot:focus-visible {
  outline: 3px solid var(--brand-red-45);
  outline-offset: 3px;
}

@media (max-width: 720px) {
  .media-slider {
    border-radius: 12px;
  }

  .media-slider--with-controls { padding-inline: 64px; }

  .media-slider__button svg { width: 28px; height: 28px; }

  .media-slider__button {
    width: 52px;
    height: 52px;
  }
}
</style>
