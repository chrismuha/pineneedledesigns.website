<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { dashboardApi } from '../../api/dashboard.js'
import { useSubcollections } from '../../composables/useSubcollections.js'
import ColorOptionEditor from './ColorOptionEditor.vue'
import SizeOptionEditor from './SizeOptionEditor.vue'

const router = useRouter()
const collections = ref([])
const pageLoading = ref(true)
const loading = ref(false)
const error = ref('')
const fieldErrors = reactive({
  subCollectionId: '',
})
const photoFiles = ref([])

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
  importantNotes: '',
  description: '',
  price: '',
  shippingCost: '',
  freeShipping: false,
  outOfStock: false,
  customProperties: [],
  subCollectionId: '',
})

const requiresSubcollection = computed(() => subcollections.value.length > 0)
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

const addProperty = () => {
  form.customProperties.push({
    name: '',
    required: false,
    options: [''],
  })
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
  form.collectionId = collections.value.find((collection) => !collection.isSystem)?._id
    || collections.value[0]?._id
    || ''
  form.colors = ['']
  form.sizes = ['']
  form.importantNotes = ''
  form.description = ''
  form.price = ''
  form.shippingCost = ''
  form.freeShipping = false
  form.outOfStock = false
  form.customProperties = []
  form.subCollectionId = ''
  clearPhotos()
  fieldErrors.subCollectionId = ''
  error.value = ''
}

const buildProductFormData = () => {
  const formData = new FormData()
  const colors = form.colors.map((color) => color.trim()).filter(Boolean)
  const sizes = form.sizes.map((size) => size.trim()).filter(Boolean)
  const customProperties = form.customProperties
    .map((property) => ({
      name: property.name.trim(),
      required: property.required,
      options: property.options.map((option) => option.trim()).filter(Boolean),
    }))
    .filter((property) => property.name && !['color', 'size'].includes(property.name.toLowerCase()))

  if (colors.length) {
    customProperties.unshift({ name: 'Color', required: true, options: colors })
  }
  if (sizes.length) {
    customProperties.push({ name: 'Size', required: true, options: sizes })
  }

  formData.append('name', form.name.trim())
  formData.append('collectionId', form.collectionId)
  formData.append('color', colors.join(', '))
  formData.append('size', sizes.join(', '))
  formData.append('importantNotes', form.importantNotes.trim())
  formData.append('description', form.description.trim())
  formData.append('price', String(form.price))
  formData.append('shippingCost', String(form.shippingCost || 0))
  formData.append('freeShipping', String(form.freeShipping))
  formData.append('outOfStock', String(form.outOfStock))
  formData.append('customProperties', JSON.stringify(customProperties))
  formData.append('subCollectionId', form.subCollectionId || '')

  photoFiles.value.forEach(({ file }) => {
    formData.append('photos', file)
  })

  return formData
}

const loadCollections = async () => {
  collections.value = await dashboardApi.getCollections()
  if (!form.collectionId) {
    form.collectionId = collections.value.find((collection) => !collection.isSystem)?._id
      || collections.value[0]?._id
      || ''
  }

  await loadSubcollections(form.collectionId)
}

const handleCollectionChange = async () => {
  form.subCollectionId = ''
  fieldErrors.subCollectionId = ''
  await loadSubcollections(form.collectionId)
}

const submitForm = async () => {
  fieldErrors.subCollectionId = ''

  if (requiresSubcollection.value && !form.subCollectionId) {
    fieldErrors.subCollectionId = 'Please select a subcollection for this collection.'
    error.value = 'Please fix the highlighted fields before submitting.'
    return
  }

  if (subcollectionsLoading.value) {
    error.value = 'Subcollections are still loading. Please wait a moment.'
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
</script>

<template>
  <div class="create-item-page dashboard-page">
    <div class="page-header">
      <h1>Create Item</h1>
      <RouterLink to="/dashboard/items" class="btn-primary">
        View All Items
      </RouterLink>
    </div>

    <p v-if="error" class="error-banner">{{ error }}</p>
    <p v-if="pageLoading" class="status-text">Loading form...</p>

    <form v-else class="item-form" @submit.prevent="submitForm">
      <section class="card">
        <div class="section-header"><h2>Basic Information</h2></div>

        <div class="form-grid">
          <div class="field">
            <label>Item Name *</label>
            <input v-model="form.name" type="text" placeholder="Premium Hoodie" required>
          </div>

          <div class="field">
            <label>Collection *</label>
            <select v-model="form.collectionId" required @change="handleCollectionChange">
              <option
                v-for="collection in sortedCollections"
                :key="collection._id"
                :value="collection._id"
              >
                {{ collection.isSystem ? 'Uncategorized' : collection.name }}
              </option>
            </select>
          </div>

          <div v-if="requiresSubcollection || subcollectionsLoading" class="field field--full">
            <label>Subcollection *</label>
            <select
              v-model="form.subCollectionId"
              required
              :disabled="subcollectionsLoading || loading"
            >
              <option value="">
                {{ subcollectionsLoading ? 'Loading subcollections...' : 'Select a subcollection' }}
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
              Manage subcollections from Items → Manage Collections → Subcollections.
            </p>
          </div>

          <div class="field field--full">
            <label>Colors</label>
            <ColorOptionEditor v-model="form.colors" :disabled="loading" />
            <p class="hint">Each color becomes an option in one Color dropdown on the item page.</p>
          </div>

          <div class="field">
            <label>Sizes</label>
            <SizeOptionEditor v-model="form.sizes" :disabled="loading" />
            <p class="hint">Each size becomes an option in one Size dropdown on the item page.</p>
          </div>
        </div>

        <div class="field">
          <label>Important Notes</label>
          <textarea v-model="form.importantNotes" rows="4" />
        </div>

        <div class="field">
          <label>Description *</label>
          <textarea v-model="form.description" rows="8" required />
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
          Add dropdown properties like color or print position.
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
              placeholder="Property Name (e.g. Color)"
            >

            <label class="checkbox-row">
              <input v-model="property.required" type="checkbox">
              Required
            </label>

            <button type="button" class="btn-danger" @click="removeProperty(propertyIndex)">
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
              <button type="button" class="btn-danger" @click="removeOption(propertyIndex, optionIndex)">Remove</button>
            </div>

            <button type="button" class="btn-primary" @click="addOption(propertyIndex)">
              + Add Option
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-header"><h2>Photos *</h2></div>

        <input type="file" class="file-selector-style" multiple accept="image/*" @change="handlePhotoUpload">

        <p class="hint">
          Upload as many photos as needed.
        </p>

        <div v-if="photoFiles.length" class="photo-grid">
          <div v-for="(photo, index) in photoFiles" :key="photo.previewUrl" class="photo-box">
            <img :src="photo.previewUrl" :alt="`Preview ${index + 1}`">
            <button type="button" class="danger-btn" @click="removePhoto(index)">Remove</button>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="section-header"><h2>Pricing & Shipping</h2></div>

        <div class="vertical-grid form-grid">
          <div class="field">
            <label>Price (USD) *</label>
            <input v-model="form.price" type="number" min="0" step="0.01" placeholder="49.99" required>
          </div>

          <div class="field">
            <label>Shipping Cost</label>
            <input v-model="form.shippingCost" type="number" min="0" step="0.01" placeholder="5.00">
          </div>
        </div>

        <label class="checkbox-row">
          <input v-model="form.freeShipping" type="checkbox">
          Free Shipping
        </label>
      </section>

      <section class="card">
        <div class="section-header"><h2>Inventory</h2></div>

        <label class="checkbox-row">
          <input v-model="form.outOfStock" type="checkbox">
          Out Of Stock
        </label>
      </section>

      <div class="actions">
        <button type="button" class="btn-ghost" @click="resetForm">
          Clear
        </button>

        <button type="submit" class="btn-primary" :disabled="loading || pageLoading || subcollectionsLoading || !photoFiles.length">
          {{ loading ? 'Creating...' : 'Create Item' }}
        </button>
      </div>
    </form>
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

.file-selector-style::file-selector-button {
  background: var(--dashboard-green);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  margin-right: 1rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .property-top {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
