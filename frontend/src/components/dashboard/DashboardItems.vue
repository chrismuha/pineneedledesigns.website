<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dashboardApi } from '../../api/dashboard.js'
import { useSubcollections } from '../../composables/useSubcollections.js'
import ColorOptionEditor from './ColorOptionEditor.vue'
import SizeOptionEditor from './SizeOptionEditor.vue'
import ShoeSizeOptionEditor from './ShoeSizeOptionEditor.vue'
import BeltSizeOptionEditor from './BeltSizeOptionEditor.vue'
import ComfortColorOptionEditor from './ComfortColorOptionEditor.vue'
import DashboardConfirmDialog from './DashboardConfirmDialog.vue'
import { sortSizeOptions, uniqueOptions } from '../../utils/sizeOptions.js'

const route = useRoute()
const router = useRouter()
const groupedCollections = ref([])
const loading = ref(true)
const error = ref('')
const modalError = ref('')
const editModalError = ref('')
const showCollectionManager = ref(false)
const showEditModal = ref(false)
const editingProduct = ref(null)
const openingProductId = ref('')
const editInitialSnapshot = ref('')
const editPhotoFiles = ref([])
const editVideoFiles = ref([])
const collectionPendingDelete = ref(null)
const deleteConfirmationStep = ref(1)
const editCancellationStep = ref(0)
const pendingSubcollectionDelete = ref(null)
const pendingProductDelete = ref(null)
const productDeleteStep = ref(0)
const collectionForm = ref({ name: '' })
const editingCollection = ref(null)
const saving = ref(false)
const managingSubcollectionsFor = ref(null)
const subcollectionForm = ref({ name: '' })
const subcollectionFieldError = ref('')
const editingSubcollection = ref(null)
const subcollectionsByCollectionId = ref({})
const subcollectionsLoadingMap = ref({})
const collectionFilters = ref({})
const collectionDetails = ref([])
const showQuickCollection = ref(false)
const quickCollectionName = ref('')
const quickCollectionError = ref('')

const editSnapshot = (product) => JSON.stringify({
  name: String(product?.name || ''),
  collectionId: String(product?.collectionId || ''),
  subCollectionId: String(product?.subCollectionId || ''),
  colors: (product?.colors || []).map((value) => String(value)),
  sizes: (product?.sizes || []).map((value) => String(value)),
  shoeSizes: (product?.shoeSizes || []).map((value) => String(value)),
  beltSizes: (product?.beltSizes || []).map((value) => String(value)),
  sizePrices: Object.fromEntries(Object.entries(product?.sizePrices || {}).sort(([left], [right]) => left.localeCompare(right))),
  comfortColors: (product?.comfortColors || []).map((value) => String(value)),
  customProperties: (product?.customProperties || []).map((property) => ({
    name: String(property.name || ''),
    required: Boolean(property.required),
    options: (property.options || []).map((value) => String(value)),
  })),
  photos: (product?.photos || []).map((value) => String(value)),
  description: String(product?.description || ''),
  generalDescription: String(product?.generalDescription || ''),
  price: String(product?.price ?? ''),
  hasBlingOptions: Boolean(product?.hasBlingOptions),
  blingPrice: String(product?.blingPrice ?? ''),
  noBlingPrice: String(product?.noBlingPrice ?? ''),
  noBlingDescription: String(product?.noBlingDescription || ''),
  shippingCost: String(product?.shippingCost ?? ''),
  outOfStock: Boolean(product?.outOfStock),
  quantity: String(product?.quantity ?? ''),
  videos: Array.isArray(product?.videos)
    ? product.videos.join('\n')
    : String(product?.videos || ''),
})

const editIsDirty = computed(() => Boolean(
  editingProduct.value
  && (editPhotoFiles.value.length > 0 || editVideoFiles.value.length > 0 || editSnapshot(editingProduct.value) !== editInitialSnapshot.value),
))

const editSizePriceRows = computed(() => editingProduct.value ? [
  ...sortSizeOptions(editingProduct.value.sizes || []).map((size) => ({ key: `shirt:${size}`, label: `Shirt Size ${size}` })),
  ...uniqueOptions(editingProduct.value.shoeSizes || []).map((size) => ({ key: `shoe:${size}`, label: `Shoe Size ${size}` })),
  ...uniqueOptions(editingProduct.value.beltSizes || []).map((size) => ({ key: `belt:${size}`, label: `Belt Size ${size}` })),
] : [])

const {
  subcollections: managerSubcollections,
  loading: subcollectionsLoading,
  error: subcollectionsError,
  loadSubcollections: loadManagerSubcollections,
  resetSubcollections: resetManagerSubcollections,
} = useSubcollections()

const {
  subcollections: editSubcollections,
  loading: editSubcollectionsLoading,
  error: editSubcollectionsError,
  loadSubcollections: loadEditSubcollections,
  resetSubcollections: resetEditSubcollections,
} = useSubcollections()

const nonSystemCollections = computed(() => groupedCollections.value
  .filter((collection) => !collection.isSystem)
  .sort((left, right) => left.name.localeCompare(
    right.name,
    undefined,
    { numeric: true, sensitivity: 'base' },
  )))
const dropdownCollections = computed(() => [...groupedCollections.value].sort((left, right) => (
  collectionLabel(left).localeCompare(collectionLabel(right), undefined, { numeric: true })
)))

const managingSubcollectionList = computed(() => {
  if (!managingSubcollectionsFor.value) return []
  const collection = groupedCollections.value.find(
    (item) => String(item._id) === String(managingSubcollectionsFor.value._id),
  )
  const items = managerSubcollections.value.length
    ? managerSubcollections.value
    : (collection?.subcollections || [])
  return [...items].sort((left, right) => left.name.localeCompare(
    right.name,
    undefined,
    { numeric: true, sensitivity: 'base' },
  ))
})

const loadItems = async () => {
  loading.value = true
  error.value = ''

  try {
    groupedCollections.value = await dashboardApi.getGroupedProducts()
    syncSubcollectionsFromGrouped()
    const requestedItemId = String(route.query.item || '')
    if (requestedItemId && !showEditModal.value) {
      const requestedProduct = groupedCollections.value
        .flatMap((collection) => collection.products || [])
        .find((product) => String(product._id) === requestedItemId)
      if (requestedProduct) await openEditModal(requestedProduct)
    }
    void prefetchCollectionSubcollections()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const syncSubcollectionsFromGrouped = () => {
  const next = { ...subcollectionsByCollectionId.value }

  groupedCollections.value.forEach((collection) => {
    if (!collection.isSystem && Array.isArray(collection.subcollections)) {
      next[String(collection._id)] = collection.subcollections
    }
  })

  subcollectionsByCollectionId.value = next
}

const fetchCollectionSubcollections = async (collectionId) => {
  const id = String(collectionId)
  subcollectionsLoadingMap.value = { ...subcollectionsLoadingMap.value, [id]: true }

  try {
    const subcollections = await dashboardApi.getSubcollections(collectionId)
    subcollectionsByCollectionId.value = {
      ...subcollectionsByCollectionId.value,
      [id]: subcollections,
    }
    return subcollections
  } catch (err) {
    error.value = err.message
    return []
  } finally {
    subcollectionsLoadingMap.value = {
      ...subcollectionsLoadingMap.value,
      [id]: false,
    }
  }
}

const getSubcollectionsForCollection = (collection) => {
  const id = String(collection._id)
  return subcollectionsByCollectionId.value[id] ?? collection.subcollections ?? []
}

const isSubcollectionsLoading = (collectionId) => (
  Boolean(subcollectionsLoadingMap.value[String(collectionId)])
)

const getCollectionFilter = (collectionId) => (
  collectionFilters.value[String(collectionId)] || 'all'
)

const setCollectionFilter = (collectionId, filter) => {
  collectionFilters.value = {
    ...collectionFilters.value,
    [String(collectionId)]: filter,
  }
}

const filteredProductsForCollection = (collection) => {
  const filter = getCollectionFilter(collection._id)
  if (filter === 'all') {
    return collection.products
  }

  return collection.products.filter(
    (product) => String(getSubCollectionId(product)) === String(filter),
  )
}

const onCollectionToggle = async (collection, event) => {
  if (!event.target.open || collection.isSystem) {
    return
  }

  await fetchCollectionSubcollections(collection._id)
}

const prefetchCollectionSubcollections = async () => {
  const collections = groupedCollections.value.filter((collection) => !collection.isSystem)
  await Promise.all(collections.map((collection) => fetchCollectionSubcollections(collection._id)))
}

const getCollectionId = (product) => String(
  product.collectionId?._id || product.collectionId || '',
)

const getSubCollectionId = (product) => {
  const value = product.subCollectionId?._id || product.subCollectionId
  return value ? String(value) : ''
}

const productSubcollectionLabel = (product) => (
  product.subCollectionId?.name || ''
)

const productCountForSubcollection = (collectionId, subcollectionId) => {
  const collection = groupedCollections.value.find(
    (item) => String(item._id) === String(collectionId),
  )
  if (!collection) return 0

  return collection.products.filter(
    (product) => String(product.subCollectionId?._id || product.subCollectionId || '') === String(subcollectionId),
  ).length
}

const productMissingSubcollection = (product, collection) => (
  !collection.isSystem
  && (collection.subcollections?.length || 0) > 0
  && !getSubCollectionId(product)
)

const resetSubcollectionForm = () => {
  subcollectionForm.value = { name: '' }
  editingSubcollection.value = null
  subcollectionFieldError.value = ''
}

const openCollectionManager = () => {
  showCollectionManager.value = true
  collectionForm.value = { name: '' }
  editingCollection.value = null
  managingSubcollectionsFor.value = null
  modalError.value = ''
  resetSubcollectionForm()
  resetManagerSubcollections()
}

const closeCollectionManager = () => {
  showCollectionManager.value = false
  collectionForm.value = { name: '' }
  editingCollection.value = null
  managingSubcollectionsFor.value = null
  modalError.value = ''
  resetSubcollectionForm()
  resetManagerSubcollections()
}

const openSubcollectionManager = async (collection) => {
  managingSubcollectionsFor.value = collection
  modalError.value = ''
  resetSubcollectionForm()
  await loadManagerSubcollections(collection._id)
}

const closeSubcollectionManager = () => {
  managingSubcollectionsFor.value = null
  resetSubcollectionForm()
  resetManagerSubcollections()
}

const saveSubcollection = async () => {
  if (!managingSubcollectionsFor.value) return

  const name = subcollectionForm.value.name.trim()
  if (!name) {
    subcollectionFieldError.value = 'Filter/sub-collection name is required.'
    return
  }

  saving.value = true
  modalError.value = ''
  subcollectionFieldError.value = ''

  try {
    if (editingSubcollection.value) {
      await dashboardApi.updateSubcollection(
        managingSubcollectionsFor.value._id,
        editingSubcollection.value._id,
        name,
      )
    } else {
      await dashboardApi.createSubcollection(managingSubcollectionsFor.value._id, name)
    }

    resetSubcollectionForm()
    await loadItems()
    await loadManagerSubcollections(managingSubcollectionsFor.value._id)
    await fetchCollectionSubcollections(managingSubcollectionsFor.value._id)

    const refreshed = groupedCollections.value.find(
      (item) => String(item._id) === String(managingSubcollectionsFor.value._id),
    )
    if (refreshed) {
      managingSubcollectionsFor.value = refreshed
    }
  } catch (err) {
    modalError.value = err.message
  } finally {
    saving.value = false
  }
}

const startEditSubcollection = (subcollection) => {
  editingSubcollection.value = subcollection
  subcollectionForm.value = { name: subcollection.name }
  subcollectionFieldError.value = ''
}

const cancelSubcollectionEdit = () => {
  resetSubcollectionForm()
}

const deleteSubcollection = async (subcollection) => {
  if (!managingSubcollectionsFor.value) return

  saving.value = true
  modalError.value = ''

  try {
    await dashboardApi.deleteSubcollection(
      managingSubcollectionsFor.value._id,
      subcollection._id,
    )

    if (editingSubcollection.value?._id === subcollection._id) {
      resetSubcollectionForm()
    }

    await loadItems()
    await loadManagerSubcollections(managingSubcollectionsFor.value._id)
    await fetchCollectionSubcollections(managingSubcollectionsFor.value._id)

    const refreshed = groupedCollections.value.find(
      (item) => String(item._id) === String(managingSubcollectionsFor.value._id),
    )
    managingSubcollectionsFor.value = refreshed || null
  } catch (err) {
    modalError.value = err.message
  } finally {
    saving.value = false
  }
}
const requestSubcollectionDeletion = (subcollection) => { pendingSubcollectionDelete.value = subcollection }
const confirmSubcollectionDeletion = async () => {
  if (!pendingSubcollectionDelete.value) return
  const subcollection = pendingSubcollectionDelete.value
  pendingSubcollectionDelete.value = null
  await deleteSubcollection(subcollection)
}

const initializeEditModal = async (product) => {
  const customProperties = product.customProperties?.length
    ? product.customProperties.map((property) => ({ ...property, options: [...(property.options || [])] }))
    : []
  const colorProperty = customProperties.find(
    (property) => String(property.name).toLowerCase() === 'color',
  )
  const colors = colorProperty?.options?.length
    ? [...colorProperty.options]
    : String(product.color || '').split(',').map((color) => color.trim()).filter(Boolean)
  const sizeProperty = customProperties.find(
    (property) => String(property.name).toLowerCase() === 'size',
  )
  const sizes = sortSizeOptions(sizeProperty?.options?.length
    ? [...sizeProperty.options]
    : String(product.size || '').split(',').map((size) => size.trim()).filter(Boolean))

  editingProduct.value = {
    ...product,
    collectionId: getCollectionId(product),
    subCollectionId: getSubCollectionId(product),
    hasBlingOptions: Boolean(product.hasBlingOptions || product.blingPrice != null || product.noBlingPrice != null),
    blingPrice: product.blingPrice ?? '',
    generalDescription: product.generalDescription || product.description || '',
    colors: colors.length ? colors : [''],
    sizes: sizes.length ? sizes : [''],
    shoeSizes: String(product.shoeSize || '').split(',').map((size) => size.trim()).filter(Boolean).length
      ? String(product.shoeSize).split(',').map((size) => size.trim()).filter(Boolean)
      : [''],
    beltSizes: String(product.beltSize || '').split(',').map((size) => size.trim()).filter(Boolean).length
      ? String(product.beltSize).split(',').map((size) => size.trim()).filter(Boolean)
      : [''],
    sizePrices: { ...(product.sizePrices || {}) },
    comfortColors: [...(product.comfortColors || [])],
    customProperties: customProperties.filter(
      (property) => !['color', 'size', 'shirt size', 'shoe size', 'belt size', 'style', 'comfort colors'].includes(String(property.name).toLowerCase()),
    ),
    videos: (product.videos || []).join('\n'),
  }
  editModalError.value = ''
  editPhotoFiles.value = []
  editVideoFiles.value = []
  editInitialSnapshot.value = editSnapshot(editingProduct.value)
  showEditModal.value = true
  await loadEditSubcollections(editingProduct.value.collectionId)
}

const openEditModal = async (product) => {
  const productId = String(product?._id || product || '')
  if (!productId || openingProductId.value) return

  openingProductId.value = productId
  error.value = ''
  try {
    const freshProduct = await dashboardApi.getProduct(productId)
    await initializeEditModal(freshProduct)
  } catch (err) {
    error.value = err.message || `Could not open ${product?.name || 'this item'} for editing.`
  } finally {
    openingProductId.value = ''
  }
}

const closeEditModal = async () => {
  editPhotoFiles.value.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
  editPhotoFiles.value = []
  editVideoFiles.value.forEach((video) => URL.revokeObjectURL(video.previewUrl))
  editVideoFiles.value = []
  showEditModal.value = false
  editingProduct.value = null
  editInitialSnapshot.value = ''
  editModalError.value = ''
  resetEditSubcollections()
  editCancellationStep.value = 0
  if (route.query.item) {
    const nextQuery = { ...route.query }
    delete nextQuery.item
    await router.replace({ path: '/dashboard/items', query: nextQuery })
  }
}

const requestEditCancellation = async () => {
  if (!editIsDirty.value) {
    await closeEditModal()
    return
  }
  editCancellationStep.value = 1
}

const continueEditCancellation = () => {
  editCancellationStep.value = 2
}

const cancelEditCancellation = () => {
  editCancellationStep.value = 0
}

const confirmEditCancellation = async () => {
  editCancellationStep.value = 0
  await closeEditModal()
}

const handleEditPhotoUpload = (event) => {
  const files = Array.from(event.target.files || [])
  const currentCount = (editingProduct.value?.photos?.length || 0) + editPhotoFiles.value.length
  const availableSlots = Math.max(0, 20 - currentCount)
  if (files.length > availableSlots) {
    editModalError.value = `A maximum of 20 photos is allowed. You can add ${availableSlots} more.`
  }
  editPhotoFiles.value.push(...files.slice(0, availableSlots).map((file) => ({
    file,
    previewUrl: URL.createObjectURL(file),
  })))
  event.target.value = ''
}

const removeExistingEditPhoto = (index) => {
  editingProduct.value?.photos.splice(index, 1)
}

const removeNewEditPhoto = (index) => {
  URL.revokeObjectURL(editPhotoFiles.value[index].previewUrl)
  editPhotoFiles.value.splice(index, 1)
}
const handleEditVideoUpload = (event) => {
  editVideoFiles.value.push(...Array.from(event.target.files || []).map((file) => ({
    file,
    previewUrl: URL.createObjectURL(file),
  })))
  event.target.value = ''
}
const removeNewEditVideo = (index) => {
  URL.revokeObjectURL(editVideoFiles.value[index].previewUrl)
  editVideoFiles.value.splice(index, 1)
}
const removeExistingEditVideo = (index) => {
  const videos = String(editingProduct.value.videos || '').split('\n').filter(Boolean)
  videos.splice(index, 1)
  editingProduct.value.videos = videos.join('\n')
}

const addEditProperty = () => editingProduct.value?.customProperties.push({
  name: '',
  required: false,
  options: [''],
})
const removeEditProperty = (index) => editingProduct.value?.customProperties.splice(index, 1)
const addEditPropertyOption = (index) => editingProduct.value?.customProperties[index].options.push('')
const removeEditPropertyOption = (propertyIndex, optionIndex) => (
  editingProduct.value?.customProperties[propertyIndex].options.splice(optionIndex, 1)
)

const subcollectionsForCollection = (collectionId) => {
  if (
    editingProduct.value
    && String(editingProduct.value.collectionId) === String(collectionId)
    && editSubcollections.value.length
  ) {
    return editSubcollections.value
  }

  const collection = groupedCollections.value.find(
    (item) => String(item._id) === String(collectionId),
  )
  return collection?.subcollections || []
}

const sortedSubcollectionsForCollection = (collectionId) => (
  [...subcollectionsForCollection(collectionId)].sort((left, right) => (
    left.name.localeCompare(right.name, undefined, { numeric: true })
  ))
)

const collectionRequiresSubcollection = (collectionId) => (
  subcollectionsForCollection(collectionId).length > 0
)

const collectionAllowsBling = (collectionId) => {
  const collection = groupedCollections.value.find(
    (item) => String(item._id) === String(collectionId),
  )
  return collection?.slug === 'shirts'
}

const handleEditCollectionChange = async () => {
  if (!editingProduct.value) return
  editingProduct.value.subCollectionId = ''
  if (!collectionAllowsBling(editingProduct.value.collectionId)) {
    editingProduct.value.hasBlingOptions = false
    editingProduct.value.blingPrice = ''
    editingProduct.value.noBlingPrice = ''
    editingProduct.value.noBlingDescription = ''
  }
  editModalError.value = ''
  await loadEditSubcollections(editingProduct.value.collectionId)
}

const openQuickCollection = () => {
  quickCollectionName.value = ''
  quickCollectionError.value = ''
  showQuickCollection.value = true
}

const closeQuickCollection = () => {
  if (saving.value) return
  showQuickCollection.value = false
  quickCollectionName.value = ''
  quickCollectionError.value = ''
}

const createQuickCollection = async () => {
  const name = quickCollectionName.value.trim()
  if (!name || !editingProduct.value) return
  saving.value = true
  quickCollectionError.value = ''
  try {
    const created = await dashboardApi.createCollection(name)
    await loadItems()
    editingProduct.value.collectionId = String(created._id)
    editingProduct.value.subCollectionId = ''
    await loadEditSubcollections(created._id)
    showQuickCollection.value = false
    quickCollectionName.value = ''
  } catch (err) {
    quickCollectionError.value = err.message
  } finally {
    saving.value = false
  }
}

const handleEditQuantityChange = () => {
  if (Number(editingProduct.value?.quantity) === 0) editingProduct.value.outOfStock = true
}

const saveProduct = async () => {
  if (!editingProduct.value) return

  if (
    editingProduct.value.hasBlingOptions
    && !String(editingProduct.value.noBlingDescription || '').trim()
  ) {
    editModalError.value = 'Description without Bling is required when the item has a No Bling style.'
    return
  }

  if (editingProduct.value.customProperties.some((property) => (
    ['color', 'size', 'shirt size', 'shoe size', 'belt size', 'style', 'comfort colors'].includes(String(property.name || '').trim().toLowerCase())
  ))) {
    editModalError.value = 'Color, Shirt Size, Shoe Size, Belt Size, Style, and Comfort Colors are built-in properties and cannot be added as custom properties.'
    return
  }

  if (!(editingProduct.value.photos?.length || editPhotoFiles.value.length)) {
    editModalError.value = 'At least one photo is required.'
    return
  }

  saving.value = true
  editModalError.value = ''

  try {
    const colors = editingProduct.value.colors.map((color) => color.trim()).filter(Boolean)
    const sizes = sortSizeOptions(editingProduct.value.sizes.map((size) => size.trim()).filter(Boolean))
    const customProperties = editingProduct.value.customProperties
      .map((property) => ({
        name: String(property.name || '').trim(),
        required: Boolean(property.required),
        options: (property.options || []).map((option) => String(option || '').trim()).filter(Boolean),
      }))
      .filter((property) => property.name && !['color', 'size', 'shirt size', 'shoe size', 'belt size', 'style', 'comfort colors'].includes(property.name.toLowerCase()))
    const formData = new FormData()
    formData.append('name', editingProduct.value.name)
    formData.append('collectionId', editingProduct.value.collectionId)
    formData.append('subCollectionId', editingProduct.value.subCollectionId || '')
    formData.append('color', colors.join(', '))
    formData.append('size', sizes.join(', '))
    formData.append('shoeSize', editingProduct.value.shoeSizes.filter(Boolean).join(', '))
    formData.append('beltSize', editingProduct.value.beltSizes.filter(Boolean).join(', '))
    formData.append('sizePrices', JSON.stringify(editSizePriceRows.value.reduce((prices, row) => {
      const value = editingProduct.value.sizePrices[row.key]
      if (value !== '' && value != null) prices[row.key] = Number(value)
      return prices
    }, {})))
    formData.append('comfortColors', JSON.stringify(editingProduct.value.comfortColors || []))
    formData.append('description', editingProduct.value.description)
    formData.append('generalDescription', editingProduct.value.hasBlingOptions
      ? String(editingProduct.value.generalDescription || editingProduct.value.description || '').trim()
      : '')
    const fallbackPrice = editingProduct.value.price
    formData.append('price', String(Number(fallbackPrice)))
    formData.append('hasBlingOptions', String(editingProduct.value.hasBlingOptions && collectionAllowsBling(editingProduct.value.collectionId)))
    formData.append('blingPrice', editingProduct.value.hasBlingOptions ? String(editingProduct.value.blingPrice ?? '') : '')
    formData.append('noBlingPrice', editingProduct.value.hasBlingOptions ? String(editingProduct.value.noBlingPrice ?? '') : '')
    formData.append('noBlingDescription', editingProduct.value.hasBlingOptions ? String(editingProduct.value.noBlingDescription || '').trim() : '')
    formData.append('shippingCost', String(Number(editingProduct.value.shippingCost || 0)))
    formData.append('outOfStock', String(editingProduct.value.outOfStock))
    formData.append('quantity', String(editingProduct.value.quantity ?? 1))
    formData.append('customProperties', JSON.stringify(customProperties))
    formData.append('photos', JSON.stringify(editingProduct.value.photos || []))
    formData.append('videos', JSON.stringify(String(editingProduct.value.videos || '').split('\n').filter(Boolean)))
    editPhotoFiles.value.forEach(({ file }) => formData.append('photos', file))
    editVideoFiles.value.forEach(({ file }) => formData.append('videos', file))

    await dashboardApi.updateProduct(editingProduct.value._id, formData)
    await closeEditModal()
    await loadItems()
  } catch (err) {
    editModalError.value = err.message
  } finally {
    saving.value = false
  }
}

const removeProduct = async (productId) => {
  try {
    await dashboardApi.deleteProduct(productId)
    await loadItems()
  } catch (err) {
    error.value = err.message
  }
}
const requestProductDeletion = (product) => {
  pendingProductDelete.value = product
  productDeleteStep.value = 1
}
const continueProductDeletion = () => { productDeleteStep.value = 2 }
const cancelProductDeletion = () => {
  pendingProductDelete.value = null
  productDeleteStep.value = 0
}
const confirmProductDeletion = async () => {
  const product = pendingProductDelete.value
  if (!product) return
  cancelProductDeletion()
  await removeProduct(product._id)
}

const saveCollection = async () => {
  const name = collectionForm.value.name.trim()
  if (!name) return

  saving.value = true
  modalError.value = ''

  try {
    if (editingCollection.value) {
      await dashboardApi.updateCollection(editingCollection.value._id, name)
    } else {
      await dashboardApi.createCollection(name)
    }
    collectionForm.value = { name: '' }
    editingCollection.value = null
    await loadItems()
  } catch (err) {
    modalError.value = err.message
  } finally {
    saving.value = false
  }
}

const startEditCollection = (collection) => {
  editingCollection.value = collection
  collectionForm.value = { name: collection.name }
  managingSubcollectionsFor.value = null
  modalError.value = ''
  resetSubcollectionForm()
  resetManagerSubcollections()
}

const cancelEditCollection = () => {
  editingCollection.value = null
  collectionForm.value = { name: '' }
  modalError.value = ''
}

const openEditCollectionManager = (collection) => {
  openCollectionManager()
  startEditCollection(collection)
}

const requestCollectionDeletion = (collection) => {
  collectionPendingDelete.value = collection
  deleteConfirmationStep.value = 1
}

const cancelCollectionDeletion = () => {
  collectionPendingDelete.value = null
  deleteConfirmationStep.value = 1
}

const continueCollectionDeletion = () => {
  deleteConfirmationStep.value = 2
}

const deleteCollection = async () => {
  const collection = collectionPendingDelete.value
  if (!collection || deleteConfirmationStep.value !== 2) return

  saving.value = true
  modalError.value = ''
  try {
    await dashboardApi.deleteCollection(collection._id, collection.name)
    if (String(managingSubcollectionsFor.value?._id) === String(collection._id)) {
      managingSubcollectionsFor.value = null
      resetSubcollectionForm()
    }
    await loadItems()
    cancelCollectionDeletion()
  } catch (err) {
    modalError.value = err.message
    error.value = err.message
  } finally {
    saving.value = false
  }
}

const collectionLabel = (collection) => {
  if (collection.isSystem) {
    return 'Uncategorized'
  }
  return collection.name
}

const setAllCollectionsOpen = (open) => {
  collectionDetails.value.forEach((details) => { if (details) details.open = open })
}

const sortedProperties = (properties = []) => [...properties].sort((left, right) => (
  left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' })
))
const sortedOptions = (options = []) => [...options].sort((left, right) => (
  left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
))
const hasStyleSpecificPrice = (product) => product.blingPrice != null || product.noBlingPrice != null
const isReservedPropertyName = (name) => ['color', 'size', 'shirt size', 'shoe size', 'belt size', 'style', 'comfort colors'].includes(String(name || '').trim().toLowerCase())
const customPropertiesForDisplay = (properties = []) => sortedProperties(properties).filter(
  (property) => !isReservedPropertyName(property.name),
)
const sizePriceEntries = (product) => Object.entries(product.sizePrices || {})
  .filter(([, price]) => Number.isFinite(Number(price)))
  .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
const sizePriceLabel = (key) => {
  const [type, size] = String(key).split(':')
  const labels = { shirt: 'Shirt Size', shoe: 'Shoe Size', belt: 'Belt Size' }
  return `${labels[type] || 'Size'} ${size}`
}

onMounted(loadItems)
watch(
  () => route.fullPath,
  () => {
    if (route.path === '/dashboard/items') {
      loadItems()
    }
  },
)
</script>

<template>
  <div class="items-page dashboard-page">
    <div class="page-header">
      <h1>Items</h1>

      <div class="header-actions">
        <button type="button" class="btn-outline" @click="setAllCollectionsOpen(false)">Collapse All</button>
        <button type="button" class="btn-outline" @click="setAllCollectionsOpen(true)">Expand All</button>
        <RouterLink to="/dashboard/create" class="create-btn btn-primary">
          Create New Item
        </RouterLink>

        <button class="manage-btn btn-outline" type="button" @click="openCollectionManager">
          Manage Collections
        </button>
      </div>
    </div>

    <p v-if="error" class="error-banner">{{ error }}</p>
    <p v-if="loading" class="status-text">Loading items...</p>

    <details
      v-for="collection in groupedCollections"
      :key="collection._id"
      ref="collectionDetails"
      class="collection"
      @toggle="onCollectionToggle(collection, $event)"
    >
      <summary>
        <span class="collection-summary-content">
          <span class="collection-summary-title">{{ collectionLabel(collection) }}</span>
          <span class="collection-count">{{ collection.products.length }} Items</span>
          <span v-if="getSubcollectionsForCollection(collection).length" class="collection-count">
            {{ getSubcollectionsForCollection(collection).length }} Filters/Sub-Collections
          </span>
        </span>
      </summary>

      <div
        v-if="!collection.isSystem"
        class="collection-header"
      >
        <h2 class="collection-title">{{ collectionLabel(collection) }}</h2>

        <p v-if="getSubcollectionsForCollection(collection).length" class="collection-subtitle">
          Filter items by sub-collection.
        </p>

        <p v-if="isSubcollectionsLoading(collection._id)" class="collection-subtitle">
          Loading filters/sub-collections...
        </p>
        <div class="collection-header-actions">
          <RouterLink :to="{ path: '/dashboard/create', query: { collection: collection._id } }" class="btn-primary">Add New Item</RouterLink>
          <button type="button" class="edit-btn btn-primary" @click="openEditCollectionManager(collection)">
            Rename Collection
          </button>
          <button
            type="button"
            class="delete-btn btn-danger"
            :disabled="saving"
            @click="requestCollectionDeletion(collection)"
          >
            Delete Collection
          </button>
        </div>

        <div
          v-if="getSubcollectionsForCollection(collection).length"
          class="collection-filters"
          aria-label="Filters/Sub-Collections"
        >
          <button
            type="button"
            class="collection-filter"
            :class="{ 'collection-filter--active': getCollectionFilter(collection._id) === 'all' }"
            :aria-pressed="getCollectionFilter(collection._id) === 'all'"
            @click="setCollectionFilter(collection._id, 'all')"
          >
            All
          </button>

          <button
            v-for="subcollection in getSubcollectionsForCollection(collection)"
            :key="subcollection._id"
            type="button"
            class="collection-filter"
            :class="{ 'collection-filter--active': getCollectionFilter(collection._id) === subcollection._id }"
            :aria-pressed="getCollectionFilter(collection._id) === subcollection._id"
            @click="setCollectionFilter(collection._id, subcollection._id)"
          >
            {{ subcollection.name }}
          </button>
        </div>
      </div>

      <p v-if="!collection.products.length" class="empty-collection">
        No items in this collection yet.
      </p>

      <p
        v-else-if="!filteredProductsForCollection(collection).length"
        class="empty-collection"
      >
        No items in this filter/sub-collection yet.
      </p>

      <div
        v-for="product in filteredProductsForCollection(collection)"
        :key="product._id"
        class="item-card"
      >
        <div class="item-header">
          <h3>{{ product.name }}</h3>

          <div class="badges">
            <span class="badge" :class="product.outOfStock ? 'red' : 'green'">
              {{ product.outOfStock ? 'Out Of Stock' : 'In Stock' }}
            </span>
            <span v-if="productSubcollectionLabel(product)" class="badge purple">
              {{ productSubcollectionLabel(product) }}
            </span>
            <span
              v-else-if="productMissingSubcollection(product, collection)"
              class="badge orange"
            >
              No Filter/Sub-Collection
            </span>
          </div>
        </div>

        <div v-if="product.photos?.length" class="photo-grid">
          <img
            v-for="(photo, index) in product.photos.slice(0, 4)"
            :key="`${product._id}-${index}`"
            :src="photo"
            :alt="`${product.name} photo ${index + 1}`"
            class="photo"
          >
        </div>

        <div class="item-details">
          <p><strong>Collection:</strong> {{ collectionLabel(collection) }}</p>
          <p v-if="productSubcollectionLabel(product)">
            <strong>Filter/Sub-Collection:</strong> {{ productSubcollectionLabel(product) }}
          </p>
          <p v-if="!hasStyleSpecificPrice(product)"><strong>General Price:</strong> ${{ Number(product.price).toFixed(2) }}</p>
          <p v-if="collectionAllowsBling(collection._id) && product.blingPrice != null"><strong>Price with Bling:</strong> ${{ Number(product.blingPrice).toFixed(2) }}</p>
          <p v-if="collectionAllowsBling(collection._id) && product.noBlingPrice != null"><strong>Price without Bling:</strong> ${{ Number(product.noBlingPrice).toFixed(2) }}</p>
          <p v-if="collectionAllowsBling(collection._id) && hasStyleSpecificPrice(product)"><strong>Style:</strong> Bling, No Bling</p>
          <p v-if="collectionAllowsBling(collection._id) && (product.hasBlingOptions || hasStyleSpecificPrice(product))">
            <strong>General Description:</strong><br>
            {{ product.generalDescription || product.description }}
          </p>
          <p><strong>Quantity Available:</strong> {{ product.quantity ?? 1 }}</p>
          <p v-if="product.color"><strong>Color:</strong> {{ product.color }}</p>
          <p v-if="product.size"><strong>Shirt Sizes:</strong> {{ product.size }}</p>
          <p v-if="product.shoeSize"><strong>Shoe Sizes:</strong> {{ product.shoeSize }}</p>
          <p v-if="product.beltSize"><strong>Belt Sizes:</strong> {{ product.beltSize }}</p>
          <p v-for="([key, price]) in sizePriceEntries(product)" :key="key">
            <strong>{{ sizePriceLabel(key) }} Price:</strong> ${{ Number(price).toFixed(2) }}
          </p>
          <p>
            <strong>{{ collectionAllowsBling(collection._id) && (product.hasBlingOptions || product.noBlingPrice != null) ? 'Description with Bling:' : 'Description:' }}</strong><br>
            {{ product.description }}
          </p>
          <p v-if="collectionAllowsBling(collection._id) && (product.hasBlingOptions || product.noBlingPrice != null)">
            <strong>Description without Bling:</strong><br>
            {{ product.noBlingDescription }}
          </p>

          <div v-if="customPropertiesForDisplay(product.customProperties).length" class="custom-properties">
            <h4>Custom Properties</h4>

            <div v-for="property in customPropertiesForDisplay(product.customProperties)" :key="property.name" class="property">
              <strong>{{ property.name }}{{ property.required ? ' *' : '' }}</strong>
              <ul>
                <li v-for="option in sortedOptions(property.options)" :key="option">{{ option }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="edit-btn" type="button" :disabled="Boolean(openingProductId)" @click.stop="openEditModal(product)">
            {{ openingProductId === String(product._id) ? 'Opening...' : 'Edit' }}
          </button>

          <button class="delete-btn btn-danger" type="button" @click="requestProductDeletion(product)">
            Remove
          </button>
        </div>
      </div>
    </details>

    <div v-if="showCollectionManager" class="modal-overlay">
      <section class="modal-card modal-card--wide modal-card--fullscreen collection-manager-modal">
        <div class="modal-header collection-manager-header">
          <h2>Manage Collections</h2>
          <button type="button" class="collection-close-button" @click="closeCollectionManager">
            Close
          </button>
        </div>

        <p v-if="modalError" class="error-banner">{{ modalError }}</p>

        <div v-if="!editingCollection" class="field">
          <label>New Collection</label>
            <div class="inline-field">
            <input v-model="collectionForm.name" type="text" placeholder="Collection name">
            <button type="button" class="continue-btn btn-primary" :disabled="saving" @click="saveCollection">
              Add Collection
            </button>
          </div>
        </div>

        <div class="collection-list">
          <div
            v-for="collection in nonSystemCollections"
            :key="collection._id"
            class="collection-row"
          >
            <div class="collection-row-main">
              <RouterLink :to="`/collections/${collection.slug}`" class="collection-manager-link">{{ collection.name }}</RouterLink>
              <span v-if="collection.subcollections?.length" class="collection-meta">
                {{ collection.subcollections.length }} filters/sub-collections
              </span>
            </div>
            <div class="collection-actions">
              <div class="subcollection-actions">
                <button
                  type="button"
                  class="manage-btn subcollection-btn"
                  @click="openSubcollectionManager(collection)"
                >
                  Filters/Sub-Collections
                </button>
              </div>

              <div class="row-actions">
                <button type="button" class="edit-btn icon-button" :disabled="saving" @click="startEditCollection(collection)">
                  <i class="bi bi-pencil" aria-hidden="true"></i>
                  <span class="button-text">Rename</span>
                </button>
                <button
                  type="button"
                  class="delete-btn btn-danger icon-button collection-delete-button"
                  :disabled="saving"
                  :aria-label="`Delete ${collection.name} collection`"
                  @click="requestCollectionDeletion(collection)"
                >
                  <i class="bi bi-trash" aria-hidden="true"></i>
                  <span class="button-text">Delete Collection</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- subcollections moved to a standalone modal (opens when managingSubcollectionsFor is set) -->
      </section>
    </div>

    <div v-if="editingCollection" class="modal-overlay" @click.self="cancelEditCollection">
      <section class="modal-card collection-rename-modal" role="dialog" aria-modal="true" aria-labelledby="rename-collection-title">
        <div class="modal-header">
          <h2 id="rename-collection-title">Rename Collection</h2>
          <button type="button" class="modal-close-button" :disabled="saving" aria-label="Cancel renaming collection" @click="cancelEditCollection">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <p v-if="modalError" class="error-banner">{{ modalError }}</p>
        <div class="field">
          <label for="collection-rename-input">Collection Name</label>
          <input
            id="collection-rename-input"
            v-model="collectionForm.name"
            type="text"
            :disabled="saving"
            autocomplete="off"
            autofocus
            @keyup.enter="saveCollection"
          >
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-outline" :disabled="saving" @click="cancelEditCollection">Cancel</button>
          <button type="button" class="btn-primary" :disabled="saving || !collectionForm.name.trim()" @click="saveCollection">
            {{ saving ? 'Saving...' : 'Save Name' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="showEditModal && editingProduct" class="modal-overlay">
      <section class="modal-card modal-card--fullscreen edit-item-modal">
        <div class="modal-header">
          <h2>Edit Item</h2>
          <button
            type="button"
            class="modal-close-button"
            aria-label="Cancel editing item"
            title="Cancel"
            @click="requestEditCancellation"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <p v-if="editModalError" class="error-banner">{{ editModalError }}</p>

        <div class="field">
          <label>Item Name</label>
          <input v-model="editingProduct.name" type="text">
        </div>

        <div class="field">
          <label>Collection</label>
          <select v-model="editingProduct.collectionId" @change="handleEditCollectionChange">
            <option
              v-for="collection in dropdownCollections"
              :key="collection._id"
              :value="String(collection._id)"
            >
              {{ collectionLabel(collection) }}
            </option>
          </select>
          <button type="button" class="collection-create-trigger" :disabled="saving" @click="openQuickCollection">
            + Create new collection
          </button>
        </div>

        <div
          v-if="collectionRequiresSubcollection(editingProduct.collectionId)"
          class="field"
        >
          <label>Filter/Sub-Collection</label>
          <select
            v-model="editingProduct.subCollectionId"
            :disabled="editSubcollectionsLoading || saving"
          >
            <option value="">
              {{ editSubcollectionsLoading ? 'Loading filters/sub-collections...' : 'Select a filter/sub-collection' }}
            </option>
            <option
              v-for="subcollection in sortedSubcollectionsForCollection(editingProduct.collectionId)"
              :key="subcollection._id"
              :value="String(subcollection._id)"
            >
              {{ subcollection.name }}
            </option>
          </select>
          <p v-if="editSubcollectionsError" class="field-error">{{ editSubcollectionsError }}</p>
        </div>

        <div class="field">
          <label>Colors</label>
          <ColorOptionEditor v-model="editingProduct.colors" :disabled="saving" />
          <p class="hint">These appear together in one Color dropdown.</p>
        </div>

        <div class="field">
          <label>Comfort Colors</label>
          <ComfortColorOptionEditor v-model="editingProduct.comfortColors" :disabled="saving" />
          <p class="hint">Choose presets or add custom choices for the Comfort Colors dropdown.</p>
        </div>

        <div class="field">
          <label>Shirt Sizes</label>
          <SizeOptionEditor v-model="editingProduct.sizes" :disabled="saving" />
          <p class="hint">These appear together in one Shirt Size dropdown.</p>
        </div>

        <div class="field">
          <label>Shoe Sizes</label>
          <ShoeSizeOptionEditor v-model="editingProduct.shoeSizes" :disabled="saving" />
          <p class="hint">Select a preset or choose Custom Size / Measurement to enter another size.</p>
        </div>

        <div class="field">
          <label>Belt Sizes</label>
          <BeltSizeOptionEditor v-model="editingProduct.beltSizes" :disabled="saving" />
          <p class="hint">Select a preset or choose Custom Size / Measurement to enter another size.</p>
        </div>

        <div v-if="editSizePriceRows.length" class="field">
          <label>Optional Size Prices</label>
          <p class="hint">Leave a size price blank to use the {{ hasStyleSpecificPrice(editingProduct) ? 'selected style price' : 'General Price' }}.</p>
          <div class="form-grid">
            <label v-for="row in editSizePriceRows" :key="row.key" class="field">
              <span>{{ row.label }}</span>
              <input v-model="editingProduct.sizePrices[row.key]" type="number" min="0" step="0.01" :placeholder="hasStyleSpecificPrice(editingProduct) ? 'Uses selected style price' : 'Uses General Price'">
            </label>
          </div>
        </div>

        <div class="field edit-section">
          <div class="edit-section-header">
            <label>Custom Properties</label>
            <button type="button" class="continue-btn" :disabled="saving" @click="addEditProperty">
              + Add Property
            </button>
          </div>
          <p v-if="!editingProduct.customProperties.length" class="hint">
            Add dropdown properties like print position or material.
          </p>
          <div
            v-for="(property, propertyIndex) in editingProduct.customProperties"
            :key="propertyIndex"
            class="edit-property-card"
          >
            <div class="edit-property-header">
              <input v-model="property.name" type="text" placeholder="Property name">
              <p v-if="isReservedPropertyName(property.name)" class="field-error">
                This is a built-in property. Use its dedicated field.
              </p>
              <label class="edit-checkbox">
                <input v-model="property.required" type="checkbox">
                Required
              </label>
              <button type="button" class="danger-btn" :disabled="saving" @click="removeEditProperty(propertyIndex)">
                Remove Property
              </button>
            </div>
            <div
              v-for="(_option, optionIndex) in property.options"
              :key="optionIndex"
              class="edit-option-row"
            >
              <input v-model="property.options[optionIndex]" type="text" placeholder="Dropdown option">
              <button
                type="button"
                class="danger-btn"
                :disabled="saving"
                @click="removeEditPropertyOption(propertyIndex, optionIndex)"
              >
                Remove
              </button>
            </div>
            <button type="button" class="continue-btn" :disabled="saving" @click="addEditPropertyOption(propertyIndex)">
              + Add Option
            </button>
          </div>
        </div>

        <div class="field edit-section">
          <label>Photos *</label>
          <input
            id="edit-photo-upload"
            class="visually-hidden-file"
            type="file"
            multiple
            accept="image/*"
            :disabled="saving"
            @change="handleEditPhotoUpload"
          >
          <label for="edit-photo-upload" class="add-photos-control" :class="{ disabled: saving }">
            <i class="bi bi-images" aria-hidden="true"></i>
            <span>
              <strong>Add Photos</strong>
              <small>Choose one or more images</small>
            </span>
          </label>
          <p v-if="editPhotoFiles.length" class="selected-photo-count">
            {{ editPhotoFiles.length }} new photo{{ editPhotoFiles.length === 1 ? '' : 's' }} selected
          </p>
          <p class="hint">Add or remove photos. At least one and no more than 20 are required.</p>
          <div class="edit-photo-grid">
            <div v-for="(photo, index) in editingProduct.photos" :key="photo" class="edit-photo-card">
              <img :src="photo" :alt="`Existing photo ${index + 1}`">
              <button type="button" class="danger-btn" :disabled="saving" @click="removeExistingEditPhoto(index)">
                Remove
              </button>
            </div>
            <div v-for="(photo, index) in editPhotoFiles" :key="photo.previewUrl" class="edit-photo-card">
              <img :src="photo.previewUrl" :alt="`New photo ${index + 1}`">
              <span class="new-photo-badge">New</span>
              <button type="button" class="danger-btn" :disabled="saving" @click="removeNewEditPhoto(index)">
                Remove
              </button>
            </div>
          </div>
        </div>

        <div class="field edit-section">
          <label>Video Files</label>
          <input type="file" multiple accept="video/*" :disabled="saving" @change="handleEditVideoUpload">
          <p class="hint">Uploaded videos are converted and stored in the managed uploads folder.</p>
          <div class="edit-photo-grid">
            <div v-for="(video, index) in String(editingProduct.videos || '').split('\n').filter(Boolean)" :key="video" class="edit-photo-card">
              <video :src="video" controls />
              <button type="button" class="danger-btn" :disabled="saving" @click="removeExistingEditVideo(index)">Remove</button>
            </div>
            <div v-for="(video, index) in editVideoFiles" :key="video.previewUrl" class="edit-photo-card">
              <video :src="video.previewUrl" controls />
              <span class="new-photo-badge">New</span>
              <button type="button" class="danger-btn" :disabled="saving" @click="removeNewEditVideo(index)">Remove</button>
            </div>
          </div>
        </div>

        <div v-if="collectionAllowsBling(editingProduct.collectionId) && editingProduct.hasBlingOptions" class="field">
          <label>General Description</label>
          <textarea v-model="editingProduct.generalDescription" rows="5" placeholder="Description shown before a style is selected." />
          <p class="hint">Defaults to the full Bling description and can be edited independently.</p>
        </div>

        <div class="field">
          <label>{{ collectionAllowsBling(editingProduct.collectionId) && editingProduct.hasBlingOptions ? 'Description with Bling' : 'Description' }}</label>
          <textarea v-model="editingProduct.description" rows="6" :placeholder="collectionAllowsBling(editingProduct.collectionId) && editingProduct.hasBlingOptions ? 'Description shown when Bling is selected.' : ''" />
        </div>

        <div v-if="!hasStyleSpecificPrice(editingProduct)" class="field">
          <label>General Price (USD)</label>
          <input v-model.number="editingProduct.price" type="number" min="0" step="0.01">
        </div>

        <div v-if="collectionAllowsBling(editingProduct.collectionId)" class="field">
          <label class="checkbox-row">
            <input v-model="editingProduct.hasBlingOptions" type="checkbox">
            <span>Offer Bling and No Bling choices</span>
          </label>
          <p class="hint">Enter a Bling or No Bling price to use style-specific pricing instead of displaying the General Price.</p>
        </div>

        <div v-if="collectionAllowsBling(editingProduct.collectionId) && editingProduct.hasBlingOptions" class="field">
          <label>Price with Bling (USD)</label>
          <input v-model="editingProduct.blingPrice" type="number" min="0" step="0.01" placeholder="Uses General Price">
        </div>

        <div v-if="collectionAllowsBling(editingProduct.collectionId) && editingProduct.hasBlingOptions" class="field">
          <label>Price without Bling (USD)</label>
          <input v-model="editingProduct.noBlingPrice" type="number" min="0" step="0.01" placeholder="Uses General Price">
        </div>

        <div v-if="collectionAllowsBling(editingProduct.collectionId) && editingProduct.hasBlingOptions" class="field">
          <label>Style</label>
          <input value="Bling, No Bling" readonly aria-label="Styles">
          <p class="hint">Style is a built-in property with Bling and No Bling choices.</p>
        </div>

        <div v-if="collectionAllowsBling(editingProduct.collectionId) && editingProduct.hasBlingOptions" class="field">
          <label>Description without Bling *</label>
          <textarea v-model="editingProduct.noBlingDescription" rows="4" placeholder="Description shown when No Bling is selected." required />
        </div>

        <div class="field">
          <label>Shipping Cost (USD)</label>
          <input v-model.number="editingProduct.shippingCost" type="number" min="0" step="0.01">
        </div>


        <div class="field">
          <label>Quantity Available</label>
          <input
            v-model.number="editingProduct.quantity"
            type="number"
            min="0"
            step="1"
            required
            @input="handleEditQuantityChange"
          >
          <p class="hint">Setting quantity to 0 automatically marks the item Out Of Stock.</p>
        </div>

        <div class="field">
          <label class="checkbox-row">
            <input v-model="editingProduct.outOfStock" type="checkbox" :disabled="Number(editingProduct.quantity) === 0">
            <span>Out Of Stock</span>
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" class="continue-btn" :disabled="saving || editSubcollectionsLoading" @click="saveProduct">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </section>
    </div>

    <div v-if="showQuickCollection" class="modal-overlay quick-collection-overlay" @click.self="closeQuickCollection">
      <section class="modal-card modal-card--fullscreen" role="dialog" aria-modal="true" aria-labelledby="quick-collection-title">
        <div class="modal-header">
          <h2 id="quick-collection-title">Create New Collection</h2>
          <button type="button" class="clear-btn" :disabled="saving" @click="closeQuickCollection">Cancel</button>
        </div>
        <p>Create a collection for this item. Existing collections are managed separately.</p>
        <p v-if="quickCollectionError" class="error-banner" role="alert">{{ quickCollectionError }}</p>
        <form class="quick-collection-form" @submit.prevent="createQuickCollection">
          <div class="field">
            <label for="quick-collection-name">Collection name</label>
            <input id="quick-collection-name" v-model="quickCollectionName" type="text" autocomplete="off" autofocus>
          </div>
          <button type="submit" class="btn-primary" :disabled="saving || !quickCollectionName.trim()">
            {{ saving ? 'Creating...' : 'Create Collection' }}
          </button>
        </form>
      </section>
    </div>

    <div v-if="editCancellationStep" class="modal-overlay destructive-confirmation-overlay">
      <section class="modal-card destructive-confirmation" role="alertdialog" aria-modal="true">
        <div class="destructive-icon" aria-hidden="true">
          <i class="bi bi-exclamation-triangle"></i>
        </div>

        <template v-if="editCancellationStep === 1">
          <p class="confirmation-step">Confirmation 1 of 2</p>
          <h2>Cancel item changes?</h2>
          <p>Any changes made in the item editor will be discarded.</p>
          <div class="confirmation-actions">
            <button type="button" class="btn-outline" @click="cancelEditCancellation">Keep Editing</button>
            <button type="button" class="btn-danger" @click="continueEditCancellation">Continue</button>
          </div>
        </template>

        <template v-else>
          <p class="confirmation-step">Confirmation 2 of 2</p>
          <h2>Discard all changes?</h2>
          <p class="destructive-warning">This cannot be undone.</p>
          <div class="confirmation-actions">
            <button type="button" class="btn-outline" @click="cancelEditCancellation">Go Back</button>
            <button type="button" class="btn-danger" @click="confirmEditCancellation">Discard Changes</button>
          </div>
        </template>
      </section>
    </div>

    <!-- standalone subcollections modal -->
    <div v-if="managingSubcollectionsFor" class="modal-overlay">
      <section class="modal-card modal-card--wide modal-card--fullscreen">
        <div class="modal-header">
          <h2>Filters/Sub-Collections for {{ managingSubcollectionsFor.name }}</h2>
          <button type="button" class="clear-btn" @click="closeSubcollectionManager">Done</button>
        </div>

        <p class="hint">
          These appear as filter chips on the storefront collection page.
        </p>

        <p v-if="subcollectionsError" class="error-banner">{{ subcollectionsError }}</p>
        <p v-if="subcollectionsLoading" class="status-text">Loading filters/sub-collections...</p>

        <div class="field">
          <label>{{ editingSubcollection ? 'Rename Filter/Sub-Collection' : 'New Filter/Sub-Collection' }}</label>
          <div class="inline-field">
            <input
              v-model="subcollectionForm.name"
              type="text"
              placeholder="e.g. Vests"
              :disabled="saving"
              @keyup.enter="saveSubcollection"
            >
            <button
              type="button"
              class="continue-btn btn-primary"
              :disabled="saving || !subcollectionForm.name.trim()"
              @click="saveSubcollection"
            >
              {{ saving ? 'Saving...' : (editingSubcollection ? 'Save Name' : 'Add Filter/Sub-Collection') }}
            </button>
            <button
              v-if="editingSubcollection"
              type="button"
              class="clear-btn btn-outline"
              :disabled="saving"
              @click="cancelSubcollectionEdit"
            >
              Cancel
            </button>
          </div>
          <p v-if="subcollectionFieldError" class="field-error">{{ subcollectionFieldError }}</p>
        </div>

        <p v-if="!subcollectionsLoading && !managingSubcollectionList.length" class="empty-subcollections">
          No filters/sub-collections yet. Add one above to create options like “Vests” or “Bracelets”.
        </p>

        <div v-else class="subcollection-list">
          <article
            v-for="subcollection in managingSubcollectionList"
            :key="subcollection._id"
            class="subcollection-row"
            :class="{ 'subcollection-row--editing': editingSubcollection?._id === subcollection._id }"
          >
            <div class="subcollection-main">
              <div class="subcollection-action-chip">
                <button type="button" class="subcollection-chip-name" :disabled="saving" @click="startEditSubcollection(subcollection)">
                  <i class="bi bi-pencil" aria-hidden="true"></i>
                  {{ subcollection.name }}
                </button>
                <button type="button" class="subcollection-chip-delete" :disabled="saving" :aria-label="`Delete ${subcollection.name}`" @click="requestSubcollectionDeletion(subcollection)">×</button>
              </div>
              <span class="subcollection-meta">
                {{ productCountForSubcollection(managingSubcollectionsFor._id, subcollection._id) }} items
              </span>
            </div>
          </article>
        </div>
      </section>
    </div>

    <DashboardConfirmDialog
      :open="Boolean(pendingSubcollectionDelete)"
      title="Delete filter/sub-collection?"
      :message="`Products in ${pendingSubcollectionDelete?.name || 'this filter/sub-collection'} will become unassigned.`"
      confirm-label="Delete Filter/Sub-Collection"
      cancel-label="Keep Filter/Sub-Collection"
      :busy="saving"
      @confirm="confirmSubcollectionDeletion"
      @cancel="pendingSubcollectionDelete = null"
    />

    <DashboardConfirmDialog
      :open="Boolean(pendingProductDelete)"
      :step-label="`Confirmation ${productDeleteStep} of 2`"
      :title="productDeleteStep === 1 ? `Delete ${pendingProductDelete?.name || 'item'}?` : 'Permanently delete this item?'"
      :message="productDeleteStep === 1 ? 'The item will be removed from the store.' : 'This action cannot be undone.'"
      :confirm-label="productDeleteStep === 1 ? 'Continue' : 'Delete Item'"
      :cancel-label="productDeleteStep === 1 ? 'Keep Item' : 'Go Back'"
      @confirm="productDeleteStep === 1 ? continueProductDeletion() : confirmProductDeletion()"
      @cancel="productDeleteStep === 1 ? cancelProductDeletion() : productDeleteStep = 1"
    />

    <div v-if="collectionPendingDelete" class="modal-overlay destructive-confirmation-overlay">
      <section class="modal-card destructive-confirmation" role="alertdialog" aria-modal="true">
        <div class="destructive-icon" aria-hidden="true">
          <i class="bi bi-exclamation-triangle"></i>
        </div>

        <template v-if="deleteConfirmationStep === 1">
          <p class="confirmation-step">Confirmation 1 of 2</p>
          <h2>Delete {{ collectionPendingDelete.name }}?</h2>
          <p>
            This will permanently delete
            <strong>{{ collectionPendingDelete.products?.length || 0 }} item{{ (collectionPendingDelete.products?.length || 0) === 1 ? '' : 's' }}</strong>
            and all filters/sub-collections inside this collection.
          </p>
          <p class="destructive-warning">This action cannot be undone.</p>
          <div class="confirmation-actions">
            <button type="button" class="btn-outline" :disabled="saving" @click="cancelCollectionDeletion">
              No, Keep Collection
            </button>
            <button type="button" class="btn-danger" :disabled="saving" @click="continueCollectionDeletion">
              Yes, Continue
            </button>
          </div>
        </template>

        <template v-else>
          <p class="confirmation-step">Final confirmation 2 of 2</p>
          <h2>Are you absolutely sure?</h2>
          <p>
            Permanently delete <strong>{{ collectionPendingDelete.name }}</strong> and everything contained in it?
          </p>
          <div class="confirmation-actions">
            <button type="button" class="btn-outline" :disabled="saving" @click="cancelCollectionDeletion">
              No, Cancel
            </button>
            <button type="button" class="btn-danger" :disabled="saving" @click="deleteCollection">
              {{ saving ? 'Deleting...' : 'Yes, Permanently Delete' }}
            </button>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<style src="../../styles/dashboard.css"></style>

<style scoped>
.collection {
  margin-bottom: 20px;
  border: 1px solid #d9e8dc;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.collection-header {
  padding: 20px 20px 8px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.collection-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.collection-title {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 700;
}

.collection-subtitle {
  margin: 0 0 16px;
  color: #666;
}

.collection summary {
  padding: 16px;
  background: #f3faf4;
  cursor: pointer;
  font-weight: 600;
}

.collection-summary-content {
  display: inline-flex;
  max-width: calc(100% - 28px);
  margin-left: 8px;
  vertical-align: top;
  flex-direction: column;
  gap: 4px;
}

.collection-summary-title {
  color: #111;
  overflow-wrap: anywhere;
}

.collection-count {
  display: block;
  color: #666;
  margin-left: 0;
}

.item-card {
  padding: 20px;
  border-top: 1px solid #e5e5e5;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin: 20px 0;
}

.photo {
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  background: #ececec;
}

.badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: .85rem;
  border: 1px solid transparent;
  opacity: 1;
  font-weight: 700;
}

.item-card .badge.green { background: #218838; border-color: #196c2c; color: #fff; }
.item-card .badge.blue { background: #1676a3; border-color: #105d81; color: #fff; }
.item-card .badge.red { background: #c91f42; border-color: #a31735; color: #fff; }
.item-card .badge.purple { background: #7651a8; border-color: #5e3f87; color: #fff; }
.item-card .badge.orange { background: #b85c00; border-color: #914900; color: #fff; }

.custom-properties { margin-top: 20px; }

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}


.modal-card {
  border: 1px solid #d9e8dc;
  border-radius: 12px;
  padding: 24px;
  background: white;
  max-width: 720px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.modal-card--wide {
  max-width: 860px;
}

.modal-card--fullscreen {
  width: 100vw;
  max-width: none;
  height: 100dvh;
  max-height: 100dvh;
  margin: 0;
  border: 0;
  border-radius: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.modal-overlay:has(.modal-card--fullscreen) {
  align-items: stretch;
  padding: 0;
}

.modal-card--fullscreen > .modal-header {
  position: sticky;
  top: 0;
  z-index: 30;
  margin: -24px -24px 20px;
  padding: 18px 24px;
  border-bottom: 1px solid #d9e0da;
  background: #fff;
  box-shadow: 0 3px 8px rgba(0, 0, 0, .08);
}

.collection-manager-modal {
  max-height: calc(100dvh - 32px);
}

.collection-manager-header {
  position: sticky;
  top: -18px;
  z-index: 5;
  margin: -18px -2px 18px;
  padding: 18px 2px 14px;
  border-bottom: 1px solid #e6e6e6;
  background: #fff;
}

.collection-close-button {
  border: 0;
  border-radius: 8px;
  padding: 10px 16px;
  background: var(--dashboard-red);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.collection-close-button:hover { filter: brightness(.92); }

.field { margin-bottom: 16px; align-items: center; }
/* .field label { display: block; margin-bottom: 8px; } */

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  box-sizing: border-box;
}

.modal-actions,
.modal-header,
.inline-field,
.row-actions,
.header-actions {
  display: flex;
  gap: 10px;
}

.edit-section {
  align-items: stretch;
  border-top: 1px solid #e3ebe4;
  padding-top: 18px;
}

.edit-section-header,
.edit-property-header,
.edit-option-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-section-header { justify-content: space-between; }
.edit-property-card { margin-top: 12px; padding: 14px; border: 1px solid #d9e8dc; border-radius: 10px; }
.edit-property-header { margin-bottom: 12px; }
.edit-property-header > input, .edit-option-row > input { flex: 1; }
.edit-option-row { margin-bottom: 10px; }
.edit-checkbox { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.edit-checkbox input { width: auto; }

.edit-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.edit-photo-card { position: relative; display: flex; flex-direction: column; gap: 8px; }
.edit-photo-card img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 8px; }
.new-photo-badge { position: absolute; top: 6px; left: 6px; padding: 3px 7px; border-radius: 999px; background: var(--dashboard-green); color: #fff; font-size: .75rem; font-weight: 700; }
.visually-hidden-file { position: absolute; width: 1px !important; height: 1px; padding: 0 !important; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0 !important; }
.add-photos-control { display: flex; width: 100%; box-sizing: border-box; align-items: center; justify-content: center; gap: 12px; padding: 18px; border: 2px dashed #83b990; border-radius: 12px; background: #f4fbf6; color: #185f30; cursor: pointer; text-align: left; transition: border-color .18s ease, background .18s ease, transform .18s ease; }
.add-photos-control:hover { border-color: var(--dashboard-green); background: #e9f7ed; transform: translateY(-1px); }
.add-photos-control:focus-within { outline: 3px solid rgba(46, 164, 79, .2); outline-offset: 2px; }
.add-photos-control i { font-size: 1.65rem; }
.add-photos-control span { display: flex; flex-direction: column; gap: 2px; }
.add-photos-control strong { font-size: 1rem; }
.add-photos-control small { color: #58715e; font-size: .84rem; font-weight: 400; }
.add-photos-control.disabled { pointer-events: none; opacity: .55; }
.selected-photo-count { margin: 0; color: #1f7a3d; font-weight: 600; }

.modal-header {
  justify-content: space-between;
  align-items: center;
}


.header-actions { gap: 12px; }

/* header and shared button styles moved to frontend/src/styles/dashboard.css */

.row-actions button {
  border: 1px solid #d0d0d0;
  /* background: #fff; */
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.row-actions { flex-wrap: wrap; justify-content: flex-end; }

.row-actions button:disabled,
.continue-btn:disabled,
.manage-btn:disabled,
.clear-btn:disabled,
.edit-btn:disabled,
.delete-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 2000;
}

.destructive-confirmation-overlay { z-index: 2200; }
.destructive-confirmation { max-width: 520px; text-align: center; }
.destructive-icon { display: grid; width: 58px; height: 58px; margin: 0 auto 12px; place-items: center; border-radius: 50%; background: var(--dashboard-red-bg); color: var(--dashboard-red); font-size: 1.7rem; }
.confirmation-step { margin: 0 0 6px; color: #666; font-size: .85rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.destructive-confirmation h2 { margin: 0 0 12px; color: #711525; }
.destructive-confirmation p { line-height: 1.55; }
.destructive-warning { color: #8a1f1f; font-weight: 700; }
.confirmation-actions { display: flex; justify-content: center; gap: 12px; margin-top: 22px; }
.confirmation-actions button { min-width: 170px; }

.collection-list,
.subcollection-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collection-row,
.subcollection-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
}

.collection-row-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collection-meta,
.subcollection-meta {
  color: #666;
  font-size: 0.9rem;
}

.subcollection-panel {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e5e5;
}

.hint {
  margin: 0 0 16px;
  color: #666;
}

.storefront-preview { margin-bottom: 16px; }

.collection-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.collection-filter {
  appearance: none;
  border: 1px solid #d0d0d0;
  border-radius: 999px;
  background: #fff;
  color: #111;
  cursor: pointer;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  min-height: 42px;
  padding: 9px 18px;
}

.collection-filter--active {
  background: #1f6f78;
  border-color: #1f6f78;
  color: #fff;
}

.subcollection-row--editing {
  border-color: var(--dashboard-green);
  background: #f3faf4;
}

.subcollection-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.subcollection-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid #d0d0d0;
  background: #fff;
  font-weight: 600;
}

.subcollection-action-chip { display: inline-grid; grid-template-columns: auto 40px; gap: 0; }
.subcollection-chip-name,
.subcollection-chip-delete { min-height: 42px; border: 1px solid var(--dashboard-green); background: #fff; font: inherit; cursor: pointer; }
.subcollection-chip-name { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px 0 0 999px; color: #185f30; font-weight: 700; }
.subcollection-chip-delete { margin-left: -1px; border-radius: 0 999px 999px 0; color: var(--dashboard-red); font-size: 1.5rem; line-height: 1; }
.subcollection-chip-name:hover { background: #edf8f0; }
.subcollection-chip-delete:hover { border-color: var(--dashboard-red); background: var(--dashboard-red); color: #fff; }
.subcollection-chip-name:disabled,
.subcollection-chip-delete:disabled { cursor: not-allowed; opacity: .55; }

  .collection-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .subcollection-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .subcollection-btn {
    white-space: nowrap;
  }

  .icon-button {
    display: flex;
    gap: 0.5rem;
  }

.field-error {
  margin: 8px 0 0;
  color: #8a1f1f;
  font-size: 0.9rem;
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

.collection-inline-rename,
.quick-collection-form {
  max-width: 680px;
}

.collection-inline-rename input { min-width: min(320px, 45vw); }
.quick-collection-overlay { z-index: 1200; }

.modal-close-button {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: #f1f1f1;
  color: #222;
  cursor: pointer;
  font: inherit;
  font-size: 2rem;
  line-height: 1;
}

.modal-close-button:hover,
.modal-close-button:focus-visible {
  background: #e1e1e1;
  outline: 2px solid var(--dashboard-green);
  outline-offset: 2px;
}

.edit-item-modal {
  scroll-padding-bottom: calc(120px + env(safe-area-inset-bottom));
  padding-bottom: calc(120px + env(safe-area-inset-bottom));
}

.status-text,
.empty-collection {
  color: #666;
  padding: 16px 20px;
}

@media (max-width: 720px) {
  .collection-row,
  .subcollection-row {
    flex-direction: column;
    align-items: stretch;
  }

  .modal-overlay { padding: 0 10px calc(72px + env(safe-area-inset-bottom)); overflow: hidden; }
  .modal-card { padding: 0 14px 18px; overflow-x: hidden; overflow-y: auto; }
  .collection-manager-modal { max-height: calc(100dvh - 72px - env(safe-area-inset-bottom)); }
  .row-actions { width: 100%; justify-content: stretch; }
  .row-actions button { flex: 1 1 140px; }
  .add-photos-control { padding: 15px; }
  .confirmation-actions { flex-direction: column-reverse; }
  .confirmation-actions button { width: 100%; min-width: 0; }
  .modal-header { position: sticky; top: 0; z-index: 30; margin: 0 -14px 16px; padding: 14px; background: #fff; border-bottom: 1px solid #d9e0da; box-shadow: 0 3px 8px rgba(0, 0, 0, .08); }
  .modal-overlay:has(.modal-card--fullscreen) { padding: 0; }
  .modal-card.modal-card--fullscreen { width: 100vw; height: 100dvh; max-height: 100dvh !important; padding: 0 14px 24px; border-radius: 0; }
  .modal-card.modal-card--fullscreen.edit-item-modal {
    padding-bottom: calc(140px + env(safe-area-inset-bottom));
    scroll-padding-bottom: calc(140px + env(safe-area-inset-bottom));
  }
  .modal-card--fullscreen > .modal-header { margin: 0 -14px 16px; padding: max(14px, env(safe-area-inset-top)) 14px 14px; }
  .inline-field, .edit-section-header, .edit-property-header, .edit-option-row { flex-direction: column; align-items: stretch; width: 100%; }
  .inline-field > *, .edit-section-header > *, .edit-property-header > *, .edit-option-row > * { width: 100%; box-sizing: border-box; }
  .item-header { align-items: flex-start; }
  .item-card .actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .item-card .actions button { min-height: 44px; }
}

@media (max-width: 850px) {
  .collection-row {
    flex-direction: column;
    align-items: stretch;
  }

  .collection-actions {
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .collection-row .row-actions {
    display: grid;
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .collection-row .row-actions button {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .collection-row .row-actions .edit-btn,
  .collection-row .row-actions .delete-btn {
    grid-column: 1 / -1;
  }

  .subcollection-actions {
    width: 100%;
    margin-bottom: 10px;
    flex: 1;
  }

  .subcollection-actions .subcollection-btn {
    width: 100%;
  }

  .collection-row .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0 8px;
    height: 44px;
  }

  .collection-row .icon-button i {
    font-size: 1.25rem;
    line-height: 1;
  }
}

@media screen and (max-width: 850px) {
  div.field {
    flex-direction: column;
    align-items: start;
  }
  .row-actions {
    justify-content: space-between;
  }
  .row-actions .icon-button {
    flex: 2;
  }

  .subcollection-actions {
    margin: 0;
  }
}
@media screen and (max-width: 600px) {
  .collection-row .icon-button .button-text { display: inline; }
}
@media screen and (max-width: 720px) {
  .subcollection-row .row-actions .edit-btn, 
  .subcollection-row .row-actions .delete-btn {
    flex: 1;
  }
}
</style>
