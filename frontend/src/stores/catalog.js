import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { catalogApi } from '../api/catalog.js'

export const useCatalogStore = defineStore('catalog', () => {
  const collectionPages = ref([])
  const visibleCollectionPages = ref([])
  const otherCollections = ref([])
  const collectionCategoryOrder = ref([])
  const navLinks = ref([])
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref('')

  const initialize = async () => {
    if (initialized.value) {
      return true
    }

    loading.value = true
    error.value = ''

    try {
      const data = await catalogApi.getCatalog()
      collectionPages.value = data.collectionPages || []
      visibleCollectionPages.value = data.visibleCollectionPages || []
      otherCollections.value = data.otherCollections || []
      collectionCategoryOrder.value = data.collectionCategoryOrder || []
      navLinks.value = data.navLinks || []
      initialized.value = true
      return true
    } catch (err) {
      error.value = err.message || 'Failed to load catalog.'
      return false
    } finally {
      loading.value = false
    }
  }

  const getCollectionBySlug = (slug) =>
    collectionPages.value.find((page) => page.slug === slug) || null

  const hasCollections = computed(() => collectionPages.value.length > 0)

  return {
    collectionPages,
    visibleCollectionPages,
    otherCollections,
    collectionCategoryOrder,
    navLinks,
    loading,
    initialized,
    error,
    hasCollections,
    initialize,
    getCollectionBySlug,
  }
})
