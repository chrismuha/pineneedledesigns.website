<script setup>
import { computed, ref, useId, watch } from 'vue'
import { dashboardApi } from '../../api/dashboard.js'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  collections: { type: Array, default: () => [] },
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue'])
const id = useId()
const subcollections = ref({})
const loading = ref({})
const errors = ref({})
const choices = computed(() => props.collections.filter((collection) => !collection.isSystem)
  .slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })))
const update = (index, patch) => emit('update:modelValue', props.modelValue.map((entry, i) => i === index ? { ...entry, ...patch } : entry))
const remove = (index) => emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
const load = async (collectionId) => {
  if (!collectionId || subcollections.value[collectionId] || loading.value[collectionId]) return
  loading.value[collectionId] = true
  errors.value[collectionId] = ''
  try {
    subcollections.value[collectionId] = (await dashboardApi.getSubcollections(collectionId))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }))
  } catch (error) {
    errors.value[collectionId] = error.message || 'Could not load sub-collections.'
  } finally {
    loading.value[collectionId] = false
  }
}
watch(() => props.modelValue.map((entry) => entry.collectionId), (ids) => {
  ids.forEach(load)
}, { immediate: true })
</script>

<template>
  <fieldset class="additional-collections" :disabled="disabled">
    <legend>Additional collections</legend>
    <p>Show this same item in more collections, such as Seasonal → Winter. Stock, photos, prices, and options stay shared.</p>
    <div v-for="(entry, index) in modelValue" :key="index" class="placement">
      <div class="placement-field">
        <label :for="`${id}-collection-${index}`">Collection {{ index + 1 }}</label>
        <select :id="`${id}-collection-${index}`" :value="entry.collectionId" required
          @change="update(index, { collectionId: $event.target.value, subCollectionId: '' })">
          <option value="" disabled>Select a collection</option>
          <option v-for="collection in choices" :key="collection._id" :value="String(collection._id)">{{ collection.name }}</option>
        </select>
      </div>
      <div v-if="entry.collectionId" class="placement-field">
        <label :for="`${id}-sub-${index}`">Sub-collection {{ index + 1 }}</label>
        <select :id="`${id}-sub-${index}`" :value="entry.subCollectionId || ''" :disabled="loading[entry.collectionId]"
          @change="update(index, { subCollectionId: $event.target.value })">
          <option value="">{{ loading[entry.collectionId] ? 'Loading…' : 'All / no sub-collection' }}</option>
          <option v-for="sub in subcollections[entry.collectionId] || []" :key="sub._id" :value="String(sub._id)">{{ sub.name }}</option>
        </select>
        <p v-if="errors[entry.collectionId]" role="alert">{{ errors[entry.collectionId] }} <button type="button" @click="load(entry.collectionId)">Retry</button></p>
      </div>
      <button type="button" class="placement-remove" :aria-label="`Remove additional collection ${index + 1}`" @click="remove(index)">Remove</button>
    </div>
    <button type="button" class="placement-add" :disabled="modelValue.length >= 50"
      @click="emit('update:modelValue', [...modelValue, { collectionId: '', subCollectionId: '' }])">+ Add another collection</button>
  </fieldset>
</template>

<style scoped>
.additional-collections { border: 1px solid var(--dashboard-items-subcollection-panel-border); border-radius: 12px; padding: 16px; margin: 8px 0 20px; min-width: 0; }
legend { float: none; width: auto; padding: 0 6px; font-size: 1.05rem; font-weight: 700; }
p { margin: 0 0 12px; line-height: 1.5; }
.placement { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; margin: 12px 0; }
.placement-field { flex: 1 1 190px; min-width: 0; }
label { display: block; margin-bottom: 6px; font-weight: 600; }
select { width: 100%; min-height: 44px; padding: 8px; color: inherit; background: var(--dashboard-items-subcollection-chip-surface); border: 1px solid var(--dashboard-items-subcollection-chip-border); border-radius: 8px; font: inherit; }
button { min-height: 44px; padding: 8px 12px; border-radius: 8px; font: inherit; font-weight: 600; cursor: pointer; background: var(--dashboard-items-subcollection-chip-surface); }
.placement-add { color: var(--dashboard-primary-action-color); border: 1px solid currentColor; }
.placement-remove { color: var(--dashboard-destructive-action-color); border: 1px solid currentColor; }
:disabled { cursor: default; opacity: .65; }
</style>
