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
const customRatio = ref(1)
const rotation = ref(0)
const zoom = ref(1)
const offset = ref({ x: 0, y: 0 })
const working = ref(false)
const error = ref('')
const drag = ref(null)
let resizeObserver
let previousBodyOverflow = ''

const orientedSize = computed(() => rotation.value % 180 === 0
  ? imageSize.value
  : { width: imageSize.value.height, height: imageSize.value.width })

const ratios = computed(() => [
  { label: 'Original', value: 'original', ratio: orientedSize.value.width / orientedSize.value.height },
  { label: 'Square', value: '1:1', ratio: 1 },
  { label: 'Portrait', value: '4:5', ratio: 4 / 5 },
  { label: 'Landscape', value: '4:3', ratio: 4 / 3 },
  { label: 'Freeform', value: 'freeform', ratio: customRatio.value },
])
const targetRatio = computed(() => ratios.value.find((item) => item.value === ratio.value)?.ratio || 1)
const viewportStyle = computed(() => ({ aspectRatio: String(targetRatio.value) }))
const baseScale = computed(() => Math.max(
  viewportSize.value.width / orientedSize.value.width,
  viewportSize.value.height / orientedSize.value.height,
))
const displayScale = computed(() => baseScale.value * zoom.value)
const renderedSize = computed(() => ({
  width: orientedSize.value.width * displayScale.value,
  height: orientedSize.value.height * displayScale.value,
}))
const maxOffset = computed(() => ({
  x: Math.max(0, (renderedSize.value.width - viewportSize.value.width) / 2),
  y: Math.max(0, (renderedSize.value.height - viewportSize.value.height) / 2),
}))
const imageStyle = computed(() => ({
  width: `${imageSize.value.width * displayScale.value}px`,
  height: `${imageSize.value.height * displayScale.value}px`,
  transform: `translate(calc(-50% + ${offset.value.x}px), calc(-50% + ${offset.value.y}px)) rotate(${rotation.value}deg)`,
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
  if (value === 'freeform' && ratio.value !== 'freeform') customRatio.value = targetRatio.value
  ratio.value = value
  await resetCrop()
}
const rotatePhoto = async () => {
  rotation.value = (rotation.value + 90) % 360
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

const orientedCanvas = () => {
  const canvas = document.createElement('canvas')
  canvas.width = orientedSize.value.width
  canvas.height = orientedSize.value.height
  const context = canvas.getContext('2d')
  context.translate(canvas.width / 2, canvas.height / 2)
  context.rotate(rotation.value * Math.PI / 180)
  context.drawImage(image.value, -imageSize.value.width / 2, -imageSize.value.height / 2)
  return canvas
}

const confirmCrop = async (useFullPhoto = false) => {
  working.value = true
  error.value = ''
  try {
    const source = orientedCanvas()
    const scale = displayScale.value
    const cropWidth = useFullPhoto ? orientedSize.value.width : viewportSize.value.width / scale
    const cropHeight = useFullPhoto ? orientedSize.value.height : viewportSize.value.height / scale
    const sourceX = useFullPhoto ? 0 : (orientedSize.value.width - cropWidth) / 2 - offset.value.x / scale
    const sourceY = useFullPhoto ? 0 : (orientedSize.value.height - cropHeight) / 2 - offset.value.y / scale
    const outputScale = Math.min(1, 2400 / Math.max(cropWidth, cropHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(cropWidth * outputScale))
    canvas.height = Math.max(1, Math.round(cropHeight * outputScale))
    canvas.getContext('2d').drawImage(
      source,
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
watch(customRatio, async () => {
  if (ratio.value !== 'freeform') return
  await nextTick()
  measure()
  clampOffset()
})
onMounted(() => {
  imageUrl.value = URL.createObjectURL(props.file)
  resizeObserver = new ResizeObserver(measure)
  if (viewport.value) resizeObserver.observe(viewport.value)
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <div class="crop-overlay" role="dialog" aria-modal="true" aria-labelledby="crop-title">
    <div class="crop-dialog">
      <header>
        <div><h2 id="crop-title">Crop photo</h2><p>Drag to reposition. Scroll below the photo for crop and rotation controls.</p></div>
        <button type="button" class="crop-exit" aria-label="Exit photo editor" :disabled="working" @click="emit('cancel')">
          <span aria-hidden="true">×</span>
          Exit
        </button>
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
        <label v-if="ratio === 'freeform'" class="zoom-control">
          <span>Crop shape</span>
          <input v-model.number="customRatio" type="range" min="0.5" max="2" step="0.01">
        </label>
        <label class="zoom-control"><span>Zoom</span><input v-model.number="zoom" type="range" min="1" max="3" step="0.01"></label>
        <button type="button" class="rotate-control" :disabled="working" @click="rotatePhoto">
          <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
          Rotate 90°
        </button>
        <p v-if="error" class="crop-error">{{ error }}</p>
      </div>

      <footer>
        <button type="button" class="btn-outline exit-button" :disabled="working" @click="emit('cancel')">Exit</button>
        <button type="button" class="btn-outline" :disabled="working" @click="confirmCrop(true)">Use Full Photo</button>
        <button type="button" class="btn-primary done-button" :disabled="working" @click="confirmCrop(false)">{{ working ? 'Preparing…' : 'Done' }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.crop-overlay { position: fixed; z-index: 8000; inset: 0; display: block; padding: 0; background: #fff; }
.crop-dialog { display: flex; width: 100vw; height: 100dvh; max-height: 100dvh; min-height: 0; box-sizing: border-box; flex-direction: column; gap: 16px; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 0 18px; border: 0; border-radius: 0; background: #fff; }
header { position: sticky; top: 0; z-index: 20; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin: 0 -18px; padding: max(16px, env(safe-area-inset-top)) 18px 14px; border-bottom: 1px solid #d9e4db; background: rgba(255,255,255,.96); backdrop-filter: blur(14px); }
h2 { margin: 0; color: #185f30; } header p { margin: 4px 0 0; color: #607066; }
.crop-exit { display: inline-flex; min-height: 42px; align-items: center; gap: 6px; padding: 7px 12px; border: 1px solid #bac8bd; border-radius: 999px; background: #fff; color: #35483a; font: inherit; font-weight: 700; }
.crop-exit span { font-size: 1.55rem; font-weight: 400; line-height: .8; }
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
.rotate-control { display: inline-flex; width: 100%; min-height: 44px; align-items: center; justify-content: center; gap: 8px; border: 1px solid #a7c9af; border-radius: 10px; background: #f5faf6; color: #185f30; font: inherit; font-weight: 700; }
.crop-error { margin: 0; color: #8a1f1f; }
footer { position: sticky; bottom: 0; z-index: 20; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; margin: auto -18px 0; padding: 14px 18px max(14px, env(safe-area-inset-bottom)); border-top: 1px solid #d9e4db; background: rgba(255,255,255,.96); backdrop-filter: blur(14px); }
footer button { min-width: 130px; }
.done-button { font-size: 1rem; font-weight: 800; }
@media (max-width: 600px) { header p { font-size: .86rem; } .crop-viewport { flex: 0 0 auto; max-height: none; } footer button { flex: 1 1 120px; min-width: 0; min-height: 48px; } .done-button { order: -1; flex-basis: 100%; } }
</style>
