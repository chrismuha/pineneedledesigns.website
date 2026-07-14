<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({ file: { type: File, required: true } })
const emit = defineEmits(['cancel', 'confirm'])

const viewport = ref(null)
const image = ref(null)
const imageUrl = ref('')
const imageSize = ref({ width: 1, height: 1 })
const viewportSize = ref({ width: 1, height: 1 })
const ratio = ref('original')
const zoom = ref(1)
const offset = ref({ x: 0, y: 0 })
const working = ref(false)
const error = ref('')
const drag = ref(null)
let resizeObserver

const ratios = computed(() => [
  { label: 'Original', value: 'original', ratio: imageSize.value.width / imageSize.value.height },
  { label: 'Square', value: '1:1', ratio: 1 },
  { label: 'Portrait', value: '4:5', ratio: 4 / 5 },
  { label: 'Landscape', value: '4:3', ratio: 4 / 3 },
])
const targetRatio = computed(() => ratios.value.find((item) => item.value === ratio.value)?.ratio || 1)
const viewportStyle = computed(() => ({ aspectRatio: String(targetRatio.value) }))
const baseScale = computed(() => Math.max(
  viewportSize.value.width / imageSize.value.width,
  viewportSize.value.height / imageSize.value.height,
))
const displayScale = computed(() => baseScale.value * zoom.value)
const renderedSize = computed(() => ({
  width: imageSize.value.width * displayScale.value,
  height: imageSize.value.height * displayScale.value,
}))
const maxOffset = computed(() => ({
  x: Math.max(0, (renderedSize.value.width - viewportSize.value.width) / 2),
  y: Math.max(0, (renderedSize.value.height - viewportSize.value.height) / 2),
}))
const imageStyle = computed(() => ({
  width: `${renderedSize.value.width}px`,
  height: `${renderedSize.value.height}px`,
  transform: `translate(calc(-50% + ${offset.value.x}px), calc(-50% + ${offset.value.y}px))`,
}))

const clampOffset = () => {
  offset.value = {
    x: Math.max(-maxOffset.value.x, Math.min(maxOffset.value.x, offset.value.x)),
    y: Math.max(-maxOffset.value.y, Math.min(maxOffset.value.y, offset.value.y)),
  }
}
const measure = () => {
  if (!viewport.value) return
  viewportSize.value = {
    width: viewport.value.clientWidth,
    height: viewport.value.clientHeight,
  }
  clampOffset()
}
const resetCrop = async () => {
  zoom.value = 1
  offset.value = { x: 0, y: 0 }
  await nextTick()
  measure()
}
const selectRatio = async (value) => {
  ratio.value = value
  await resetCrop()
}
const onImageLoad = async () => {
  imageSize.value = { width: image.value.naturalWidth, height: image.value.naturalHeight }
  await resetCrop()
}
const startDrag = (event) => {
  viewport.value?.setPointerCapture?.(event.pointerId)
  drag.value = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offset: { ...offset.value } }
}
const moveDrag = (event) => {
  if (!drag.value || drag.value.pointerId !== event.pointerId) return
  offset.value = {
    x: drag.value.offset.x + event.clientX - drag.value.x,
    y: drag.value.offset.y + event.clientY - drag.value.y,
  }
  clampOffset()
}
const endDrag = () => { drag.value = null }
const onZoom = () => clampOffset()

const confirmCrop = async () => {
  working.value = true
  error.value = ''
  try {
    const scale = displayScale.value
    const cropWidth = viewportSize.value.width / scale
    const cropHeight = viewportSize.value.height / scale
    const sourceX = (imageSize.value.width - cropWidth) / 2 - offset.value.x / scale
    const sourceY = (imageSize.value.height - cropHeight) / 2 - offset.value.y / scale
    const outputScale = Math.min(1, 2400 / Math.max(cropWidth, cropHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(cropWidth * outputScale))
    canvas.height = Math.max(1, Math.round(cropHeight * outputScale))
    canvas.getContext('2d').drawImage(
      image.value,
      sourceX, sourceY, cropWidth, cropHeight,
      0, 0, canvas.width, canvas.height,
    )
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', .92))
    if (!blob) throw new Error('The cropped photo could not be created.')
    const baseName = props.file.name.replace(/\.[^.]+$/, '') || 'photo'
    emit('confirm', new File([blob], `${baseName}-cropped.webp`, { type: 'image/webp', lastModified: Date.now() }))
  } catch (err) {
    error.value = err.message || 'The cropped photo could not be created.'
  } finally {
    working.value = false
  }
}

watch(zoom, onZoom)
onMounted(() => {
  imageUrl.value = URL.createObjectURL(props.file)
  resizeObserver = new ResizeObserver(measure)
  if (viewport.value) resizeObserver.observe(viewport.value)
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="crop-overlay" role="dialog" aria-modal="true" aria-labelledby="crop-title">
    <div class="crop-dialog">
      <header>
        <div><h2 id="crop-title">Crop photo</h2><p>Drag to reposition, then confirm what will be uploaded.</p></div>
        <button type="button" class="crop-close" aria-label="Cancel cropping" :disabled="working" @click="emit('cancel')">×</button>
      </header>

      <div
        ref="viewport"
        class="crop-viewport"
        :style="viewportStyle"
        @pointerdown.prevent="startDrag"
        @pointermove.prevent="moveDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
      >
        <img ref="image" :src="imageUrl" alt="Photo being cropped" :style="imageStyle" draggable="false" @load="onImageLoad">
        <span class="crop-grid" aria-hidden="true"></span>
      </div>

      <div class="crop-controls">
        <div class="ratio-controls" aria-label="Crop shape">
          <button v-for="option in ratios" :key="option.value" type="button" :class="{ active: ratio === option.value }" @click="selectRatio(option.value)">{{ option.label }}</button>
        </div>
        <label class="zoom-control"><span>Zoom</span><input v-model.number="zoom" type="range" min="1" max="3" step="0.01"></label>
        <p v-if="error" class="crop-error">{{ error }}</p>
      </div>

      <footer>
        <button type="button" class="btn-outline" :disabled="working" @click="emit('cancel')">Cancel</button>
        <button type="button" class="btn-primary" :disabled="working" @click="confirmCrop">{{ working ? 'Preparing…' : 'Use this crop' }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.crop-overlay { position: fixed; z-index: 8000; inset: 0; display: grid; place-items: center; padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom)); background: rgba(5, 18, 9, .82); backdrop-filter: blur(12px); }
.crop-dialog { display: flex; width: min(680px, 100%); max-height: 100%; flex-direction: column; gap: 16px; overflow-y: auto; padding: 18px; border: 1px solid rgba(255,255,255,.35); border-radius: 18px; background: #fff; box-shadow: 0 24px 70px rgba(0,0,0,.35); }
header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
h2 { margin: 0; color: #185f30; } header p { margin: 4px 0 0; color: #607066; }
.crop-close { border: 0; background: transparent; color: #445148; font-size: 2rem; line-height: 1; }
.crop-viewport { position: relative; width: 100%; max-height: min(58vh, 560px); overflow: hidden; align-self: center; background: #152119; cursor: grab; touch-action: none; user-select: none; }
.crop-viewport:active { cursor: grabbing; }
.crop-viewport img { position: absolute; top: 50%; left: 50%; max-width: none; pointer-events: none; }
.crop-grid { position: absolute; inset: 0; border: 2px solid rgba(255,255,255,.85); background: linear-gradient(90deg, transparent 33.15%, rgba(255,255,255,.35) 33.33%, transparent 33.5%, transparent 66.48%, rgba(255,255,255,.35) 66.66%, transparent 66.84%), linear-gradient(0deg, transparent 33.15%, rgba(255,255,255,.35) 33.33%, transparent 33.5%, transparent 66.48%, rgba(255,255,255,.35) 66.66%, transparent 66.84%); pointer-events: none; }
.crop-controls { display: grid; gap: 14px; }
.ratio-controls { display: flex; flex-wrap: wrap; gap: 8px; }
.ratio-controls button { flex: 1 1 auto; min-height: 38px; padding: 7px 12px; border: 1px solid #a7c9af; border-radius: 999px; background: #f5faf6; color: #25442e; }
.ratio-controls button.active { border-color: var(--dashboard-green); background: var(--dashboard-green); color: #fff; }
.zoom-control { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 12px; color: #25442e; font-weight: 700; }
.zoom-control input { width: 100%; accent-color: var(--dashboard-green); }
.crop-error { margin: 0; color: #8a1f1f; }
footer { display: flex; justify-content: flex-end; gap: 10px; }
footer button { min-width: 130px; }
@media (max-width: 600px) { .crop-overlay { padding-right: 0; padding-left: 0; } .crop-dialog { width: 100%; height: 100%; max-height: none; box-sizing: border-box; border-radius: 0; } .crop-viewport { max-height: 52vh; } footer { margin-top: auto; } footer button { flex: 1; min-width: 0; min-height: 48px; } }
</style>
