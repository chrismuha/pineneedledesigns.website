<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const props = defineProps({ file: { type: File, required: true } })
const emit = defineEmits(['cancel', 'confirm'])

const image = ref(null)
const imageUrl = ref('')
const selectedRatio = ref('freeform')
const working = ref(false)
const error = ref('')
let cropper = null
let previousBodyOverflow = ''

const ratios = [
  { label: 'Freeform', value: 'freeform', ratio: NaN },
  { label: 'Original', value: 'original', ratio: null },
  { label: 'Square', value: '1:1', ratio: 1 },
  { label: 'Portrait', value: '4:5', ratio: 4 / 5 },
  { label: 'Landscape', value: '4:3', ratio: 4 / 3 },
]

const initializeCropper = () => {
  cropper?.destroy()
  cropper = new Cropper(image.value, {
    viewMode: 1,
    dragMode: 'move',
    initialAspectRatio: NaN,
    autoCropArea: 0.86,
    responsive: true,
    restore: false,
    guides: true,
    center: true,
    highlight: true,
    background: false,
    movable: true,
    rotatable: true,
    scalable: false,
    zoomable: true,
    zoomOnTouch: true,
    zoomOnWheel: true,
    wheelZoomRatio: 0.08,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
  })
}

const selectRatio = (option) => {
  selectedRatio.value = option.value
  if (!cropper) return

  if (option.value === 'original') {
    const data = cropper.getImageData()
    cropper.setAspectRatio(data.naturalWidth / data.naturalHeight)
    return
  }
  cropper.setAspectRatio(option.ratio)
}

const rotatePhoto = () => cropper?.rotate(90)
const zoomIn = () => cropper?.zoom(0.12)
const zoomOut = () => cropper?.zoom(-0.12)
const resetCrop = () => {
  selectedRatio.value = 'freeform'
  cropper?.reset()
  cropper?.setAspectRatio(NaN)
}

const fullPhotoCropBox = () => {
  cropper.reset()
  cropper.setAspectRatio(NaN)
  const canvas = cropper.getCanvasData()
  const container = cropper.getContainerData()
  cropper.setCropBoxData({
    left: Math.max(0, canvas.left),
    top: Math.max(0, canvas.top),
    width: Math.min(container.width, canvas.width),
    height: Math.min(container.height, canvas.height),
  })
}

const confirmCrop = async (useFullPhoto = false) => {
  if (!cropper) return
  working.value = true
  error.value = ''
  try {
    if (useFullPhoto) fullPhotoCropBox()
    await nextTick()
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 2400,
      maxHeight: 2400,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      fillColor: '#fff',
    })
    if (!canvas) throw new Error('The cropped photo could not be created.')
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

onMounted(() => {
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  imageUrl.value = URL.createObjectURL(props.file)
})

onBeforeUnmount(() => {
  cropper?.destroy()
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <div class="crop-overlay" role="dialog" aria-modal="true" aria-labelledby="crop-title">
    <section class="crop-editor">
      <header>
        <div>
          <h2 id="crop-title">Edit Photo</h2>
          <p>Move and resize the crop box. Pinch or use the controls to zoom.</p>
        </div>
        <button type="button" class="crop-close-button" aria-label="Exit photo editor" title="Exit" :disabled="working" @click="emit('cancel')">
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div class="crop-stage">
        <img ref="image" :src="imageUrl" alt="Photo being cropped" @load="initializeCropper">
      </div>

      <div class="editor-controls">
        <div class="ratio-controls" aria-label="Crop shape">
          <button
            v-for="option in ratios"
            :key="option.value"
            type="button"
            :class="{ active: selectedRatio === option.value }"
            @click="selectRatio(option)"
          >{{ option.label }}</button>
        </div>
        <div class="tool-controls" aria-label="Photo tools">
          <button type="button" @click="zoomOut"><i class="bi bi-dash-lg" aria-hidden="true"></i> Zoom</button>
          <button type="button" @click="zoomIn"><i class="bi bi-plus-lg" aria-hidden="true"></i> Zoom</button>
          <button type="button" @click="rotatePhoto"><i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Rotate</button>
          <button type="button" @click="resetCrop"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Reset</button>
        </div>
        <p v-if="error" class="crop-error" role="alert">{{ error }}</p>
      </div>

      <footer>
        <button type="button" class="btn-outline" :disabled="working" @click="emit('cancel')">Exit</button>
        <button type="button" class="btn-outline" :disabled="working" @click="confirmCrop(true)">Use Full Photo</button>
        <button type="button" class="btn-primary done-button" :disabled="working" @click="confirmCrop(false)">{{ working ? 'Preparing…' : 'Done' }}</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.crop-overlay { position: fixed; z-index: 10000; inset: 0; padding: 10px; background: rgba(4, 13, 7, .82); backdrop-filter: blur(18px) saturate(120%); -webkit-backdrop-filter: blur(18px) saturate(120%); }
.crop-editor { display: grid; grid-template-rows: auto minmax(260px, 1fr) auto auto; width: 100%; height: 100%; min-height: 0; overflow: hidden; border: 1px solid rgba(255,255,255,.3); border-radius: 20px; background: rgba(19, 27, 21, .96); color: #fff; box-shadow: 0 28px 90px rgba(0,0,0,.5); }
header { display: flex; z-index: 2; align-items: flex-start; justify-content: space-between; gap: 16px; padding: max(16px, env(safe-area-inset-top)) 18px 14px; border-bottom: 1px solid rgba(255,255,255,.14); background: rgba(23,34,26,.88); backdrop-filter: blur(14px); }
h2 { margin: 0; color: #fff; } header p { margin: 4px 0 0; color: rgba(255,255,255,.68); }
.crop-close-button { display: grid; width: 44px; height: 44px; flex: 0 0 44px; place-items: center; border: 0; border-radius: 999px; background: #f1f1f1; color: #222; cursor: pointer; font: inherit; font-size: 2rem; line-height: 1; }
.crop-close-button:hover, .crop-close-button:focus-visible { background: var(--dashboard-red-bg); color: var(--dashboard-red); outline: 2px solid var(--dashboard-red); outline-offset: 2px; }
.crop-close-button:disabled { cursor: not-allowed; opacity: .55; }
.crop-stage { min-height: 0; padding: 12px; background: #080b09; overflow: hidden; }
.crop-stage img { display: block; max-width: 100%; }
.editor-controls { display: grid; gap: 10px; padding: 12px 18px; border-top: 1px solid rgba(255,255,255,.12); background: rgba(23,34,26,.92); }
.ratio-controls, .tool-controls { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.ratio-controls button, .tool-controls button { min-height: 40px; padding: 7px 13px; border: 1px solid rgba(255,255,255,.24); border-radius: 999px; background: rgba(255,255,255,.09); color: #fff; font: inherit; font-weight: 700; }
.ratio-controls button.active { border-color: #9fd9ae; background: var(--dashboard-green); }
.tool-controls button { border-radius: 10px; }
.tool-controls i { margin-right: 4px; }
.crop-error { margin: 0; color: #ffc4cc; text-align: center; }
footer { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; padding: 14px 18px max(14px, env(safe-area-inset-bottom)); border-top: 1px solid rgba(255,255,255,.14); background: rgba(23,34,26,.94); }
footer button { min-width: 130px; }
.done-button { font-size: 1rem; font-weight: 800; }
:deep(.cropper-container) { width: 100% !important; height: 100% !important; }
:deep(.cropper-view-box) { outline-color: rgba(255,255,255,.95); outline-width: 2px; }
:deep(.cropper-line) { background-color: rgba(255,255,255,.9); }
:deep(.cropper-point) { width: 14px; height: 14px; border: 2px solid #fff; border-radius: 50%; background-color: var(--dashboard-green); opacity: 1; }
:deep(.cropper-point.point-se) { width: 18px; height: 18px; }
:deep(.cropper-dashed) { border-color: rgba(255,255,255,.55); }
:deep(.cropper-face) { background-color: transparent; }
@media (max-width: 600px) { .crop-overlay { padding: 0; } .crop-editor { grid-template-rows: auto minmax(240px, 1fr) auto auto; border: 0; border-radius: 0; } header p { font-size: .82rem; } .crop-stage { padding: 6px; } .editor-controls { padding: 10px; } .ratio-controls button, .tool-controls button { min-height: 38px; padding: 6px 10px; font-size: .78rem; } footer { padding-right: 10px; padding-left: 10px; } footer button { flex: 1 1 105px; min-width: 0; min-height: 48px; } .done-button { order: -1; flex-basis: 100%; } }
@media (max-height: 700px) { header p { display: none; } .editor-controls { gap: 7px; padding-top: 8px; padding-bottom: 8px; } .ratio-controls button, .tool-controls button { min-height: 34px; } }
</style>
