<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dashboardApi } from '../../api/dashboard.js'
import { useSubcollections } from '../../composables/useSubcollections.js'
import ColorOptionEditor from './ColorOptionEditor.vue'
import SizeOptionEditor from './SizeOptionEditor.vue'
import ShoeSizeOptionEditor from './ShoeSizeOptionEditor.vue'
import BeltSizeOptionEditor from './BeltSizeOptionEditor.vue'
import ComfortColorOptionEditor from './ComfortColorOptionEditor.vue'
import { sortSizeOptions, uniqueOptions } from '../../utils/sizeOptions.js'
import { showDashboardToast } from '../../utils/dashboardToast.js'

const router = useRouter()
const route = useRoute()
const collections = ref([])
const pageLoading = ref(true)
const loading = ref(false)
const error = ref('')
const fieldErrors = reactive({
  subCollectionId: '',
})
const photoFiles = ref([])
const videoFiles = ref([])
const showCreateCollection = ref(false)
const newCollectionName = ref('')
const collectionError = ref('')
const creatingCollection = ref(false)

const {
  subcollections,
  loading: subcollectionsLoading,
  error: subcollectionsError,
  loadSubcollections,
} = useSubcollections()

const form = reactive({
  name: '',
  collectionId: '',
  colors: [''],
  sizes: [''],
  shoeSizes: [''],
  beltSizes: [''],
  sizePrices: {},
  comfortColors: [],
  description: '',
  generalDescription: '',
  price: '',
  hasBlingOptions: false,
  blingPrice: '',
  noBlingPrice: '',
  noBlingDescription: '',
  shippingCost: '',
  outOfStock: false,
  quantity: 88,
  customProperties: [],
  subCollectionId: '',
})

const requiresSubcollection = computed(() => subcollections.value.length > 0)
const collectionAllowsBling = computed(() => collections.value.find(
  (collection) => String(collection._id) === String(form.collectionId),
)?.slug === 'shirts')
const sizePriceRows = computed(() => [
  ...sortSizeOptions(form.sizes).map((size) => ({ key: `shirt:${size}`, label: `Shirt Size ${size}` })),
  ...uniqueOptions(form.shoeSizes).map((size) => ({ key: `shoe:${size}`, label: `Shoe Size ${size}` })),
  ...uniqueOptions(form.beltSizes).map((size) => ({ key: `belt:${size}`, label: `Belt Size ${size}` })),
])
const sortedCollections = computed(() => [...collections.value].sort((left, right) => (
  (left.isSystem ? 'Uncategorized' : left.name).localeCompare(
    right.isSystem ? 'Uncategorized' : right.name,
    undefined,
    { numeric: true },
  )
)))
const sortedSubcollections = computed(() => [...subcollections.value].sort((left, right) => (
  left.name.localeCompare(right.name, undefined, { numeric: true })
)))
const isReservedPropertyName = (name) => ['color', 'size', 'shirt size', 'shoe size', 'belt size', 'style', 'comfort colors'].includes(String(name || '').trim().toLowerCase())
const hasReservedCustomProperty = computed(() => form.customProperties.some(
  (property) => isReservedPropertyName(property.name),
))
const hasStyleSpecificPrice = computed(() => (
  form.blingPrice !== '' && form.blingPrice != null
) || (
  form.noBlingPrice !== '' && form.noBlingPrice != null
))

const revokePhotoPreview = (photo) => {
  if (photo?.previewUrl) {
    URL.revokeObjectURL(photo.previewUrl)
  }
}

const clearPhotos = () => {
  photoFiles.value.forEach(revokePhotoPreview)
  photoFiles.value = []
}

const handlePhotoUpload = (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  const nextPhotos = files.map((file) => ({
    file,
    previewUrl: URL.createObjectURL(file),
  }))

  photoFiles.value.push(...nextPhotos)
  event.target.value = ''
}

const removePhoto = (index) => {
  revokePhotoPreview(photoFiles.value[index])
  photoFiles.value.splice(index, 1)
}

const handleVideoUpload = (event) => {
  videoFiles.value.push(...Array.from(event.target.files || []).map((file) => ({
    file,
    previewUrl: URL.createObjectURL(file),
  })))
  event.target.value = ''
}
const removeVideo = (index) => {
  URL.revokeObjectURL(videoFiles.value[index].previewUrl)
  videoFiles.value.splice(index, 1)
}

const addProperty = () => {
  form.customProperties.push({
    name: '',
    required: false,
    options: [''],
  })
}

const openCreateCollection = () => {
  newCollectionName.value = ''
  collectionError.value = ''
  showCreateCollection.value = true
}

const closeCreateCollection = () => {
  if (creatingCollection.value) return
  showCreateCollection.value = false
  newCollectionName.value = ''
  collectionError.value = ''
}

const createCollection = async () => {
  const name = newCollectionName.value.trim()
  if (!name) {
    collectionError.value = 'Collection name is required.'
    return
  }

  creatingCollection.value = true
  collectionError.value = ''
  try {
    const collection = await dashboardApi.createCollection(name)
    collections.value = await dashboardApi.getCollections()
    const createdCollection = collections.value.find((item) => String(item._id) === String(collection._id))
    if (!createdCollection) {
      throw new Error('The collection was created but could not be selected. Please reload and try again.')
    }
    form.collectionId = String(createdCollection._id)
    form.subCollectionId = ''
    await loadSubcollections(form.collectionId)
    showCreateCollection.value = false
    newCollectionName.value = ''
  } catch (err) {
    collectionError.value = err.message
  } finally {
    creatingCollection.value = false
  }
}

const removeProperty = (index) => {
  form.customProperties.splice(index, 1)
}

const addOption = (propertyIndex) => {
  form.customProperties[propertyIndex].options.push('')
}

const removeOption = (propertyIndex, optionIndex) => {
  form.customProperties[propertyIndex].options.splice(optionIndex, 1)
}

const resetForm = () => {
  form.name = ''
  form.collectionId = ''
  form.colors = ['']
  form.sizes = ['']
  form.shoeSizes = ['']
  form.beltSizes = ['']
  form.sizePrices = {}
  form.comfortColors = []
  form.description = ''
  form.generalDescription = ''
  form.price = ''
  form.hasBlingOptions = false
  form.blingPrice = ''
  form.noBlingPrice = ''
  form.noBlingDescription = ''
  form.shippingCost = ''
  form.outOfStock = false
  form.quantity = 88
  form.customProperties = []
  form.subCollectionId = ''
  clearPhotos()
  videoFiles.value.forEach((video) => URL.revokeObjectURL(video.previewUrl))
  videoFiles.value = []
  fieldErrors.subCollectionId = ''
  error.value = ''
}

const buildProductFormData = () => {
  const formData = new FormData()
  const colors = form.colors.map((color) => color.trim()).filter(Boolean)
  const sizes = sortSizeOptions(form.sizes.map((size) => size.trim()).filter(Boolean))
  const customProperties = form.customProperties
    .map((property) => ({
      name: property.name.trim(),
      required: property.required,
      options: property.options.map((option) => option.trim()).filter(Boolean),
    }))
    .filter((property) => property.name && !['color', 'size', 'shirt size', 'shoe size', 'belt size', 'style', 'comfort colors'].includes(property.name.toLowerCase()))

  formData.append('name', form.name.trim())
  formData.append('collectionId', form.collectionId)
  formData.append('color', colors.join(', '))
  formData.append('size', sizes.join(', '))
  formData.append('shoeSize', form.shoeSizes.filter(Boolean).join(', '))
  formData.append('beltSize', form.beltSizes.filter(Boolean).join(', '))
  formData.append('sizePrices', JSON.stringify(sizePriceRows.value.reduce((prices, row) => {
    const value = form.sizePrices[row.key]
    if (value !== '' && value != null) prices[row.key] = Number(value)
    return prices
  }, {})))
  formData.append('comfortColors', JSON.stringify(form.comfortColors))
  formData.append('description', form.description.trim())
  formData.append('generalDescription', form.hasBlingOptions
    ? (form.generalDescription.trim() || form.description.trim())
    : '')
  const fallbackPrice = hasStyleSpecificPrice.value
    ? (form.blingPrice !== '' && form.blingPrice != null ? form.blingPrice : form.noBlingPrice)
    : form.price
  formData.append('price', String(fallbackPrice))
  formData.append('hasBlingOptions', String(form.hasBlingOptions && collectionAllowsBling.value))
  formData.append('blingPrice', form.hasBlingOptions ? String(form.blingPrice) : '')
  formData.append('noBlingPrice', form.hasBlingOptions ? String(form.noBlingPrice) : '')
  formData.append('noBlingDescription', form.hasBlingOptions ? form.noBlingDescription.trim() : '')
  formData.append('shippingCost', String(form.shippingCost || 0))
  formData.append('outOfStock', String(form.outOfStock))
  formData.append('quantity', String(form.quantity))
  formData.append('customProperties', JSON.stringify(customProperties))
  formData.append('subCollectionId', form.subCollectionId || '')

  photoFiles.value.forEach(({ file }) => {
    formData.append('photos', file)
  })
  videoFiles.value.forEach(({ file }) => formData.append('videos', file))

  return formData
}

const loadCollections = async () => {
  collections.value = await dashboardApi.getCollections()
  if (route.query.collection && collections.value.some((collection) => String(collection._id) === String(route.query.collection))) {
    form.collectionId = String(route.query.collection)
  }

  await loadSubcollections(form.collectionId)
}

const handleCollectionChange = async () => {
  form.subCollectionId = ''
  if (!collectionAllowsBling.value) {
    form.hasBlingOptions = false
    form.blingPrice = ''
    form.noBlingPrice = ''
    form.noBlingDescription = ''
    form.generalDescription = ''
  }
  fieldErrors.subCollectionId = ''
  await loadSubcollections(form.collectionId)
}

const submitForm = async () => {
  fieldErrors.subCollectionId = ''

  const requirements = []
  if (!form.name.trim()) requirements.push('Enter an item name.')
  if (!form.collectionId) requirements.push('Select a collection.')
  if (!form.description.trim()) requirements.push('Enter a description.')
  if (!photoFiles.value.length) requirements.push('Add at least one photo.')
  if (!hasStyleSpecificPrice.value && (form.price === '' || Number(form.price) < 0)) {
    requirements.push('Enter a valid general price.')
  }
  if (form.hasBlingOptions && !form.noBlingDescription.trim()) {
    requirements.push('Enter the description without bling.')
  }
  if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) {
    requirements.push('Enter a whole-number quantity of zero or more.')
  }

  if (hasReservedCustomProperty.value) {
    requirements.push('Remove built-in fields from Custom Properties; use their dedicated fields instead.')
  }

  if (requirements.length) {
    showDashboardToast(requirements.join(' '), {
      type: 'warning',
      title: `Cannot create item — ${requirements.length} requirement${requirements.length === 1 ? '' : 's'} missing`,
      duration: 9000,
    })
    return
  }

  if (subcollectionsLoading.value) {
    showDashboardToast('Filters and sub-collections are still loading. Please wait a moment and try again.', {
      type: 'warning',
      title: 'Item is not ready to create',
    })
    return
  }

  loading.value = true
  error.value = ''

  try {
    await dashboardApi.createProduct(buildProductFormData())

    router.push('/dashboard/items')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  pageLoading.value = true
  error.value = ''

  try {
    await loadCollections()
  } catch (err) {
    error.value = err.message
  } finally {
    pageLoading.value = false
  }
})

watch(
  () => form.collectionId,
  async (collectionId) => {
    try {
      await loadSubcollections(collectionId)
      const allowedIds = new Set(subcollections.value.map((item) => String(item._id)))
      if (!allowedIds.has(String(form.subCollectionId))) {
        form.subCollectionId = ''
      }
    } catch (err) {
      error.value = err.message
    }
  },
)

watch(
  () => form.quantity,
  (quantity) => {
    if (Number(quantity) === 0) form.outOfStock = true
  },
)
</script>

<template>
  <div class="create-item-page dashboard-page">
    <div class="page-header">
      <h1>Create Item</h1>
      <RouterLink to="/dashboard/items" class="btn-primary">
        View All Items
      </RouterLink>
    </div>

    <p v-if="pageLoading" class="status-text">Loading form...</p>

    <form v-else class="item-form" novalidate @submit.prevent="submitForm">
      <section class="card">
        <div class="section-header"><h2>Basic Information</h2></div>

        <div class="form-grid">
          <div class="field">
            <label>Item Name *</label>
            <input v-model="form.name" type="text" placeholder="Item Title" required>
          </div>

          <div class="field">
            <label>Collection *</label>
            <select v-model="form.collectionId" required @change="handleCollectionChange">
              <option value="" disabled>Select a collection</option>
              <option
                v-for="collection in sortedCollections"
                :key="collection._id"
                :value="collection._id"
              >
                {{ collection.isSystem ? 'Uncategorized' : collection.name }}
              </option>
            </select>
            <button type="button" class="collection-create-trigger" @click="openCreateCollection">
              + Create new collection
            </button>
          </div>

          <div v-if="requiresSubcollection || subcollectionsLoading" class="field field--full">
            <label>Filter/Sub-Collection</label>
            <select
              v-model="form.subCollectionId"
              :disabled="subcollectionsLoading || loading"
            >
              <option value="">
                {{ subcollectionsLoading ? 'Loading filters/sub-collections...' : 'Select a filter/sub-collection' }}
              </option>
              <option
                v-for="subcollection in sortedSubcollections"
                :key="subcollection._id"
                :value="subcollection._id"
              >
                {{ subcollection.name }}
              </option>
            </select>
            <p v-if="subcollectionsError" class="field-error">{{ subcollectionsError }}</p>
            <p v-else-if="fieldErrors.subCollectionId" class="field-error">{{ fieldErrors.subCollectionId }}</p>
            <p v-else class="hint">
              Manage filters/sub-collections from Items → Manage Collections → Filters/Sub-Collections.
            </p>
          </div>

          <div class="field field--full">
            <label>Colors</label>
            <ColorOptionEditor v-model="form.colors" :disabled="loading" />
            <p class="hint">Each color becomes an option in one Color dropdown on the item page.</p>
          </div>

          <div class="field field--full">
            <label>Comfort Colors</label>
            <ComfortColorOptionEditor v-model="form.comfortColors" :disabled="loading" />
            <p class="hint">Choose presets or add custom choices for the Comfort Colors dropdown on the item page.</p>
          </div>

          <div class="field">
            <label>Shirt Sizes</label>
            <SizeOptionEditor v-model="form.sizes" :disabled="loading" />
            <p class="hint">Each size becomes an option in one Shirt Size dropdown on the item page.</p>
          </div>

          <div class="field">
            <label>Shoe Sizes</label>
            <ShoeSizeOptionEditor v-model="form.shoeSizes" :disabled="loading" />
            <p class="hint">Select a preset or choose Custom Size / Measurement to enter another size.</p>
          </div>

          <div class="field">
            <label>Belt Sizes</label>
            <BeltSizeOptionEditor v-model="form.beltSizes" :disabled="loading" />
            <p class="hint">Select a preset or choose Custom Size / Measurement to enter another size.</p>
          </div>

          <div v-if="sizePriceRows.length" class="field field--full">
            <label>Optional Size Prices</label>
            <p class="hint">Leave a size price blank to use the {{ hasStyleSpecificPrice ? 'selected style price' : 'General Price' }}.</p>
            <div class="form-grid">
              <label v-for="row in sizePriceRows" :key="row.key" class="field">
                <span>{{ row.label }}</span>
                <input v-model="form.sizePrices[row.key]" type="number" min="0" step="0.01" :placeholder="hasStyleSpecificPrice ? 'Uses selected style price' : 'Uses General Price'">
              </label>
            </div>
          </div>

        </div>

        <div v-if="form.hasBlingOptions" class="field">
          <label>General Description</label>
          <textarea v-model="form.generalDescription" rows="5" :placeholder="form.description || 'Description shown before a style is selected.'" />
          <p class="hint">Defaults to the full Bling description when left blank.</p>
        </div>

        <div class="field">
          <label>{{ form.hasBlingOptions ? 'Description with Bling *' : 'Description *' }}</label>
          <textarea v-model="form.description" rows="8" :placeholder="form.hasBlingOptions ? 'Description shown when Bling is selected.' : ''" required />
        </div>
      </section>

      <section class="card">
        <div class="section-header"><h2>Videos</h2></div>
        <input type="file" class="dashboard-file-input" multiple accept="video/*" @change="handleVideoUpload">
        <p class="hint">Videos are converted to web format and stored in the managed uploads folder.</p>
        <div v-if="videoFiles.length" class="photo-grid">
          <div v-for="(video, index) in videoFiles" :key="video.previewUrl" class="photo-box">
            <video :src="video.previewUrl" controls />
            <button type="button" class="dashboard-remove-btn" @click="removeVideo(index)">Remove</button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-header">
          <h2>Custom Properties</h2>
          <button type="button" class="btn-primary" @click="addProperty">
            + Add Property
          </button>
        </div>

        <p v-if="!form.customProperties.length" class="hint">
          Add dropdown properties like print position or material. Built-in item choices are managed separately above.
        </p>

        <div
          v-for="(property, propertyIndex) in form.customProperties"
          :key="propertyIndex"
          class="property-card"
        >
          <div class="property-top">
            <input
              v-model="property.name"
              type="text"
              placeholder="Property Name (e.g. Material)"
            >
            <p v-if="isReservedPropertyName(property.name)" class="field-error">
              This is a built-in property. Use its dedicated field.
            </p>

            <label class="checkbox-row">
              <input v-model="property.required" type="checkbox">
              Required
            </label>

            <button type="button" class="dashboard-remove-btn" @click="removeProperty(propertyIndex)">
              Remove
            </button>
          </div>

          <div class="property-options">
            <h4>Dropdown Options</h4>

            <div
              v-for="(option, optionIndex) in property.options"
              :key="optionIndex"
              class="option-row"
            >
              <input v-model="property.options[optionIndex]" type="text" placeholder="Option">
              <button type="button" class="dashboard-remove-btn" @click="removeOption(propertyIndex, optionIndex)">Remove</button>
            </div>

            <button type="button" class="btn-primary" @click="addOption(propertyIndex)">
              + Add Option
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-header"><h2>Photos *</h2></div>

        <input type="file" class="dashboard-file-input" multiple accept="image/*" @change="handlePhotoUpload">

        <p class="hint">
          Upload as many photos as needed.
        </p>

        <div v-if="photoFiles.length" class="photo-grid">
          <div v-for="(photo, index) in photoFiles" :key="photo.previewUrl" class="photo-box">
            <img :src="photo.previewUrl" :alt="`Preview ${index + 1}`">
            <button type="button" class="dashboard-remove-btn" @click="removePhoto(index)">Remove</button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-header"><h2>Pricing & Shipping</h2></div>

        <div class="vertical-grid form-grid">
          <div v-if="!hasStyleSpecificPrice" class="field">
            <label>General Price (USD) *</label>
            <input v-model="form.price" type="number" min="0" step="0.01" placeholder="38.00" required>
          </div>

          <div v-if="collectionAllowsBling" class="field field--full">
            <label class="checkbox-row">
              <input v-model="form.hasBlingOptions" type="checkbox">
              Offer Bling and No Bling choices
            </label>
            <p class="hint">Enter a Bling or No Bling price to use style-specific pricing instead of displaying the General Price.</p>
          </div>

          <div v-if="form.hasBlingOptions" class="field">
            <label>Price with Bling (USD)</label>
            <input v-model="form.blingPrice" type="number" min="0" step="0.01" placeholder="Uses General Price">
          </div>

          <div v-if="form.hasBlingOptions" class="field">
            <label>Price without Bling (USD)</label>
            <input v-model="form.noBlingPrice" type="number" min="0" step="0.01" placeholder="Uses General Price">
          </div>

          <div v-if="form.hasBlingOptions" class="field field--full">
            <label>Description without Bling *</label>
            <textarea v-model="form.noBlingDescription" rows="4" placeholder="Description shown when No Bling is selected." required />
          </div>

          <div class="field">
            <label>Shipping Cost</label>
            <input v-model="form.shippingCost" type="number" min="0" step="0.01" placeholder="5.00">
          </div>
        </div>

      </section>

      <section class="card">
        <div class="section-header"><h2>Inventory</h2></div>

        <div class="field">
          <label>Quantity Available *</label>
          <input v-model.number="form.quantity" type="number" min="0" step="1" required>
          <p class="hint">Setting quantity to 0 automatically marks the item Out Of Stock.</p>
        </div>

        <label class="checkbox-row">
          <input v-model="form.outOfStock" type="checkbox" :disabled="Number(form.quantity) === 0">
          Out Of Stock
        </label>
      </section>

      <div class="actions">
        <button type="submit" class="btn-primary" :disabled="loading || pageLoading">
          {{ loading ? 'Creating...' : 'Create Item' }}
        </button>
      </div>
    </form>

    <div v-if="showCreateCollection" class="modal-overlay" @click.self="closeCreateCollection">
      <section class="modal-card modal-card--fullscreen create-collection-modal" role="dialog" aria-modal="true" aria-labelledby="create-collection-title">
        <div class="modal-header">
          <h2 id="create-collection-title">Create New Collection</h2>
          <button type="button" class="clear-btn" :disabled="creatingCollection" @click="closeCreateCollection">Cancel</button>
        </div>
        <p class="hint">Create a collection for this item. Existing collections are managed from the Items page.</p>
        <p v-if="collectionError" class="error-banner" role="alert">{{ collectionError }}</p>
        <form @submit.prevent="createCollection">
          <div class="field">
            <label for="new-collection-name">Collection name</label>
            <input id="new-collection-name" v-model="newCollectionName" type="text" autocomplete="off" autofocus>
          </div>
          <div class="actions">
            <button type="submit" class="btn-primary" :disabled="creatingCollection || !newCollectionName.trim()">
              {{ creatingCollection ? 'Creating...' : 'Create Collection' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style src="../../styles/dashboard.css"></style>

<style scoped>
.item-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: #fff;
  border: 1px solid #d8eadb;
  border-radius: 14px;
  padding: 24px;
}

.card h2 {
  margin-top: 0;
  color: #1f7a3d;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.field--full {
  grid-column: 1 / -1;
}

.hint {
  margin: 8px 0 0;
  color: #666;
  font-size: 0.92rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cfd8cf;
  border-radius: 8px;
  padding: 12px;
  font: inherit;
}

textarea {
  resize: vertical;
}

.checkbox-row {
  display: flex;
  align-items: center;
  width: fit-content;
  gap: 10px;
}
.checkbox-row > * {
  width: fit-content;
}

.section-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.property-card {
  border: 1px solid #d8eadb;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
}

.property-top {
  display: flex;
  gap: 16px;
  align-items: center;
}

.property-top input {
  flex: 1;
}

.property-options {
  margin-top: 16px;
}

.option-row {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.option-row input {
  flex: 1;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.photo-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.photo-box img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 10px;
  border: 2px dashed #c7d9ca;
}

/* button utilities are provided by frontend/src/styles/dashboard.css */

.actions {
  display: flex;
  gap: 12px;
}

.hint {
  color: #666;
  margin-top: 8px;
}

.error-banner {
  background: #ffe2e2;
  color: #8a1f1f;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.status-text {
  color: #666;
  margin-bottom: 16px;
}

.field-error {
  margin: 8px 0 0;
  color: #8a1f1f;
  font-size: 0.9rem;
}

.vertical-grid {
  grid-template-columns: 1fr;
}

.collection-create-trigger {
  align-self: flex-start;
  border: 0;
  padding: 2px 0;
  background: transparent;
  color: var(--dashboard-green);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.create-collection-modal form { max-width: 680px; }

@media (max-width: 768px) {
  .item-form { gap: 14px; }
  .card { padding: 18px 16px; border-radius: 12px; }
  .form-grid {
    grid-template-columns: 1fr;
  }

  .property-top {
    flex-direction: column;
    align-items: stretch;
  }
  .option-row { flex-direction: column; }
  .option-row button { align-self: flex-start; }
  .actions { position: static; padding: 10px 0; background: #fff; }
  .actions .btn-primary { width: 100%; min-height: 48px; }
  input, select, textarea { min-height: 48px; font-size: 16px; }
}
</style>
