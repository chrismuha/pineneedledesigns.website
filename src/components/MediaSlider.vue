<template>
  <section
    class="media-slider"
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
      @pointerleave="endDrag"
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
            :aria-label="item.alt || label"
            controls
            muted
            playsinline
            :preload="index === currentIndex ? 'metadata' : 'none'"
          ></video>
          <img
            v-else-if="shouldLoad(index)"
            class="media-slider__media"
            :src="item.src"
            :alt="item.alt || ''"
            :loading="index === currentIndex ? 'eager' : 'lazy'"
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
      <i class="bi bi-chevron-left" aria-hidden="true"></i>
    </button>
    <button
      v-if="showControls"
      class="media-slider__button media-slider__button--next"
      type="button"
      :aria-label="`Next ${mediaTypeLabel}`"
      @click="next"
    >
      <i class="bi bi-chevron-right" aria-hidden="true"></i>
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

const props = defineProps({
  media: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: 'Media gallery',
  },
})

const currentIndex = ref(0)
const dragStartX = ref(0)
const dragOffsetX = ref(0)
const isDragging = ref(false)
const loadedIndexes = ref(new Set([0]))

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
          alt: '',
          poster: '',
        }
      }

      return {
        src: item.src,
        type: typeFor(item),
        alt: item.alt || '',
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
}

const shouldLoad = (index) => loadedIndexes.value.has(index)

watch(
  currentIndex,
  (index) => {
    queueNearbyMedia(index)
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

const startDrag = (event) => {
  if (!showControls.value) return
  isDragging.value = true
  dragStartX.value = event.clientX
  dragOffsetX.value = 0
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

const moveDrag = (event) => {
  if (!isDragging.value) return
  dragOffsetX.value = event.clientX - dragStartX.value
}

const endDrag = () => {
  if (!isDragging.value) return

  const threshold = 48
  if (dragOffsetX.value <= -threshold) next()
  if (dragOffsetX.value >= threshold) previous()

  cancelDrag()
}

const cancelDrag = () => {
  isDragging.value = false
  dragOffsetX.value = 0
}
</script>

<style scoped>
.media-slider {
  position: relative;
  width: 100%;
  border-radius: 16px;
  background: linear-gradient(180deg, var(--muted), var(--soft-ink));
  overflow: hidden;
  touch-action: pan-y;
}

.media-slider:focus-visible {
  outline: 3px solid var(--brand-red-45);
  outline-offset: 4px;
}

.media-slider__viewport {
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
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  background: var(--white-92);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transform: translateY(-50%);
  transition: background 180ms ease, transform 180ms ease;
}

.media-slider__button:hover {
  background: var(--white);
  transform: translateY(-50%) scale(1.04);
}

.media-slider__button:focus-visible {
  outline: 3px solid var(--brand-red-45);
  outline-offset: 3px;
}

.media-slider__button--previous {
  left: 12px;
}

.media-slider__button--next {
  right: 12px;
}

.media-slider__dots {
  position: absolute;
  right: 12px;
  bottom: 12px;
  left: 12px;
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

@media (max-width: 640px) {
  .media-slider {
    border-radius: 12px;
  }

  .media-slider__button {
    width: 38px;
    height: 38px;
  }
}
</style>
