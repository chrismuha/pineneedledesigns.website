<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { getDashboardDarkPhotoEditorEnabled } from '../../utils/dashboardAppearance.js'

const props = defineProps({
  file: { type: File, required: true },
  initialCropState: { type: Object, default: null },
})
const emit = defineEmits(['cancel', 'confirm'])

const image = ref(null)
const imageUrl = ref('')
const selectedRatio = ref('freeform')
const working = ref(false)
const error = ref('')
const darkEditorEnabled = getDashboardDarkPhotoEditorEnabled()
let cropper = null
let previousBodyOverflow = ''
let previousDocumentOverflow = ''

const preventPageScroll = (event) => event.preventDefault()

const ratios = [
  { label: 'Freeform', value: 'freeform', ratio: NaN },
  { label: 'Square', value: '1:1', ratio: 1 },
  { label: 'Portrait', value: '4:5', ratio: 4 / 5 },
  { label: 'Landscape', value: '4:3', ratio: 4 / 3 },
  { label: 'Original', value: 'original', ratio: null },
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
    ready() {
      if (!props.initialCropState?.data) return
      selectedRatio.value = props.initialCropState.ratio || 'freeform'
      const ratio = ratios.find((option) => option.value === selectedRatio.value)
      if (ratio?.value === 'original') {
        const imageData = this.cropper.getImageData()
        this.cropper.setAspectRatio(imageData.naturalWidth / imageData.naturalHeight)
      } else {
        this.cropper.setAspectRatio(ratio?.ratio ?? NaN)
      }
      this.cropper.setData(props.initialCropState.data)
    },
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
      fillColor: 'var(--dashboard-photo-cropper-else-maxwidth)',
    })
    if (!canvas) throw new Error('The cropped photo could not be created.')
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', .92))
    if (!blob) throw new Error('The cropped photo could not be created.')
    const baseName = props.file.name.replace(/\.[^.]+$/, '') || 'photo'
    emit('confirm', {
      file: new File([blob], `${baseName}-cropped.webp`, { type: 'image/webp', lastModified: Date.now() }),
      sourceFile: props.file,
      cropState: {
        ratio: useFullPhoto ? 'freeform' : selectedRatio.value,
        data: cropper.getData(true),
      },
    })
  } catch (err) {
    error.value = err.message || 'The cropped photo could not be created.'
  } finally {
    working.value = false
  }
}

onMounted(() => {
  previousBodyOverflow = document.body.style.overflow
  previousDocumentOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  document.addEventListener('touchmove', preventPageScroll, { passive: false })
  imageUrl.value = URL.createObjectURL(props.file)
})

onBeforeUnmount(() => {
  cropper?.destroy()
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  document.removeEventListener('touchmove', preventPageScroll)
  document.body.style.overflow = previousBodyOverflow
  document.documentElement.style.overflow = previousDocumentOverflow
})
</script>

<template>
  <Teleport to="body">
    <div class="crop-overlay" :class="{ 'crop-overlay--dark': darkEditorEnabled }" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <section class="crop-editor">
      <div class="crop-header">
        <div>
          <h2 id="crop-title">Edit Photo</h2>
          <p>Move and resize the crop box. Pinch or use the controls to zoom.</p>
        </div>
        <button type="button" class="crop-close-button" aria-label="Exit photo editor" title="Exit" :disabled="working" @click="emit('cancel')">
          <span aria-hidden="true">×</span>
        </button>
      </div>

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

      <div class="crop-footer">
        <button type="button" class="btn-outline" :disabled="working" @click="emit('cancel')">Exit</button>
        <button type="button" class="btn-outline" :disabled="working" @click="confirmCrop(true)">Use Full Photo</button>
        <button type="button" class="btn-primary done-button" :disabled="working" @click="confirmCrop(false)">{{ working ? 'Preparing…' : 'Done' }}</button>
      </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.crop-overlay { position: fixed; z-index: 2147483000; inset: 0; width: 100vw; height: 100dvh; box-sizing: border-box; overflow: hidden; overscroll-behavior: none; touch-action: none; padding: 10px; background: var(--dashboard-photo-cropper-overlay-surface); backdrop-filter: blur(18px) saturate(125%); -webkit-backdrop-filter: blur(18px) saturate(125%); }
.crop-editor { display: grid; position: relative; grid-template-rows: auto minmax(260px, 1fr) auto auto; width: 100%; height: 100%; min-height: 0; overflow: hidden; border: 1px solid var(--dashboard-photo-cropper-crop-editor-border); border-radius: 20px; background: var(--dashboard-photo-cropper-crop-editor-surface); color: var(--dashboard-photo-cropper-crop-editor-text); box-shadow: 0 28px 90px var(--dashboard-photo-cropper-crop-editor-shadow); }
.crop-header { display: flex; z-index: 2; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 14px 18px; border-bottom: 1px solid var(--dashboard-photo-cropper-crop-header-border); background: var(--dashboard-photo-cropper-crop-header-surface); backdrop-filter: blur(14px); }
h2 { margin: 0; color: var(--dashboard-photo-cropper-h2-text); } .crop-header p { margin: 4px 0 0; color: var(--dashboard-photo-cropper-crop-header-p-text); }
.crop-close-button { display: grid; width: 44px; height: 44px; flex: 0 0 44px; place-items: center; border: 0; border-radius: 999px; background: var(--dashboard-photo-cropper-crop-close-button-surface); color: var(--dashboard-photo-cropper-crop-close-button-text); cursor: pointer; font: inherit; font-size: 24pt; line-height: 1; }
.crop-close-button:hover, .crop-close-button:focus-visible { background: var(--dashboard-destructive-action-soft-surface); color: var(--dashboard-destructive-action-color); outline: 2px solid var(--dashboard-destructive-action-color); outline-offset: 2px; }
.crop-close-button:disabled { cursor: not-allowed; opacity: .55; }
.crop-stage { position: relative; z-index: 0; min-height: 0; overflow: hidden; isolation: isolate; contain: strict; clip-path: inset(0); transform: translateZ(0); touch-action: none; padding: 12px; background: var(--dashboard-photo-cropper-crop-stage-surface); }
.crop-stage img { display: block; max-width: 100%; }
.editor-controls { display: grid; position: relative; z-index: 100; gap: 10px; padding: 12px 18px; border-top: 1px solid var(--dashboard-photo-cropper-editor-controls-border); background: var(--dashboard-photo-cropper-editor-controls-surface); }
.ratio-controls, .tool-controls { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.ratio-controls button, .tool-controls button { min-height: 40px; padding: 7px 13px; border: 1px solid var(--dashboard-photo-cropper-tool-controls-button-border); border-radius: 999px; background: var(--dashboard-photo-cropper-tool-controls-button-surface); color: var(--dashboard-photo-cropper-tool-controls-button-text); font: inherit; font-weight: 700; }
.ratio-controls button.active { border-color: var(--dashboard-photo-cropper-ratio-controls-button-active-border); background: var(--dashboard-primary-action-color); color: var(--dashboard-photo-cropper-ratio-controls-button-active-text); }
.tool-controls button { border-radius: 10px; }
.tool-controls i { margin-right: 4px; }
.crop-error { margin: 0; color: var(--dashboard-destructive-action-color); text-align: center; }
.crop-footer { display: flex; position: relative; z-index: 3; flex-wrap: wrap; justify-content: flex-end; gap: 10px; margin: 0; padding: 10px 18px; border-top: 1px solid var(--dashboard-photo-cropper-crop-footer-border); background: var(--dashboard-photo-cropper-crop-footer-surface); }
.crop-footer button { min-width: 130px; }
.done-button { font-size: 12pt; font-weight: 800; }
:deep(.cropper-container) { width: 100% !important; height: 100% !important; overflow: hidden; }
:deep(.cropper-view-box) { outline-color: var(--dashboard-photo-cropper-done-button-focus-ring); outline-width: 2px; }
:deep(.cropper-line) { background-color: var(--dashboard-photo-cropper-done-button-surface); }
:deep(.cropper-point) { width: 14px; height: 14px; border: 2px solid var(--dashboard-photo-cropper-done-button-border); border-radius: 50%; background-color: var(--dashboard-primary-action-color); opacity: 1; }
:deep(.cropper-point.point-se) { width: 18px; height: 18px; }
:deep(.cropper-point.point-nw) { top: 0; left: 0; }
:deep(.cropper-point.point-n) { top: 0; margin-top: 0; }
:deep(.cropper-point.point-ne) { top: 0; right: 0; }
:deep(.cropper-point.point-w) { left: 0; margin-left: 0; }
:deep(.cropper-point.point-e) { right: 0; margin-right: 0; }
:deep(.cropper-point.point-sw) { bottom: 0; left: 0; }
:deep(.cropper-point.point-s) { bottom: 0; margin-bottom: 0; }
:deep(.cropper-point.point-se) { right: 0; bottom: 0; }
:deep(.cropper-dashed) { border-color: var(--dashboard-photo-cropper-done-button-border-2); }
:deep(.cropper-face) { background-color: transparent; }
.crop-overlay--dark { background: var(--dashboard-photo-cropper-crop-overlay-dark-surface); }
.crop-overlay--dark .crop-editor { border-color: var(--dashboard-photo-cropper-crop-overlay-dark-crop-editor-border); background: var(--dashboard-photo-cropper-crop-overlay-dark-crop-editor-surface); color: var(--dashboard-photo-cropper-crop-overlay-dark-crop-editor-text); box-shadow: 0 28px 90px var(--dashboard-photo-cropper-crop-overlay-dark-crop-editor-shadow); }
.crop-overlay--dark .crop-header { border-bottom-color: var(--dashboard-photo-cropper-crop-overlay-dark-crop-header-border); background: var(--dashboard-photo-cropper-crop-overlay-dark-crop-header-surface); }
.crop-overlay--dark h2 { color: var(--dashboard-photo-cropper-crop-overlay-dark-h2-text); }
.crop-overlay--dark .crop-header p { color: var(--dashboard-photo-cropper-overlay-dark-crop-header-p-text); }
.crop-overlay--dark .crop-stage { background: var(--dashboard-photo-cropper-crop-overlay-dark-crop-stage-surface); }
.crop-overlay--dark .editor-controls { border-top-color: var(--dashboard-photo-cropper-crop-overlay-dark-editor-controls-border); background: var(--dashboard-photo-cropper-crop-overlay-dark-editor-controls-surface); }
.crop-overlay--dark .ratio-controls button,
.crop-overlay--dark .tool-controls button { border-color: var(--dashboard-photo-cropper-overlay-dark-tool-controls-button-border); background: var(--dashboard-photo-cropper-overlay-dark-tool-controls-button-surface); color: var(--dashboard-photo-cropper-overlay-dark-tool-controls-button-text); }
.crop-overlay--dark .ratio-controls button.active { border-color: var(--dashboard-photo-cropper-dark-ratio-controls-button-active-border); background: var(--dashboard-primary-action-color); }
.crop-overlay--dark .crop-error { color: var(--dashboard-photo-cropper-crop-overlay-dark-crop-error-text); }
.crop-overlay--dark .crop-footer { border-top-color: var(--dashboard-photo-cropper-crop-overlay-dark-crop-footer-border); background: var(--dashboard-photo-cropper-crop-overlay-dark-crop-footer-surface); }
@media (max-width: 600px) {
  .crop-overlay { padding: 0; }
  .crop-editor { grid-template-rows: auto minmax(0, 1fr) auto; height: 100dvh; padding-bottom: 57px; border: 0; border-radius: 0; }
  .crop-header { align-items: center; padding: 10px 12px; }
  .crop-header p { display: none; }
  .crop-stage { padding: 0; }
  .editor-controls { min-width: 0; gap: 7px; padding: 8px 10px; }
  .ratio-controls, .tool-controls { display: grid; width: 100%; gap: 5px; }
  .ratio-controls { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  .tool-controls { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .ratio-controls button, .tool-controls button { width: 100%; min-width: 0; min-height: 38px; padding: 5px 2px; font-size: clamp(7.44pt, 2.6vw, 9pt); white-space: nowrap; }
  .tool-controls i { margin-right: 2px; }
  .crop-footer { display: grid; position: absolute; right: 0; bottom: 0; left: 0; grid-template-columns: repeat(3, minmax(0, 1fr)); box-sizing: border-box; padding: 3px 8px 2px; }
  .crop-footer button { width: 100%; min-width: 0; min-height: 48px; padding-inline: 6px; font-size: 9.36pt; white-space: nowrap; }
}
@media (max-height: 700px) { .crop-header p { display: none; } .editor-controls { gap: 6px; padding-top: 6px; padding-bottom: 6px; } .ratio-controls button, .tool-controls button { min-height: 34px; } }
</style>
