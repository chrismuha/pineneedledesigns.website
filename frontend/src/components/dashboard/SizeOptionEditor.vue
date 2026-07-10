<script setup>
import { computed, ref, watch } from 'vue'
import { shirtSizeTemplates } from '../../data/siteData.js'

const CUSTOM_VALUE = '__custom__'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [''],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
const customRows = ref(new Set())
const dropdownOptions = computed(() => [
  ...shirtSizeTemplates.map((size) => ({ label: size, value: size })),
  { label: 'Custom…', value: CUSTOM_VALUE },
].sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true })))
const normalizeRows = (sizes) => (sizes?.length ? sizes.map((size) => String(size || '')) : [''])

watch(
  () => props.modelValue,
  (sizes) => {
    const nextCustomRows = new Set(customRows.value)
    normalizeRows(sizes).forEach((size, index) => {
      if (size && !shirtSizeTemplates.includes(size)) nextCustomRows.add(index)
    })
    customRows.value = nextCustomRows
  },
  { immediate: true, deep: true },
)

const selectedChoice = (size, index) => {
  if (customRows.value.has(index)) return CUSTOM_VALUE
  return shirtSizeTemplates.includes(size) ? size : ''
}
const optionAvailable = (option, index) => (
  option.value === CUSTOM_VALUE
  || selectedChoice(normalizeRows(props.modelValue)[index], index) === option.value
  || !normalizeRows(props.modelValue).includes(option.value)
)

const updateRows = (rows) => emit('update:modelValue', normalizeRows(rows))

const selectChoice = (index, choice) => {
  const rows = normalizeRows(props.modelValue)
  const nextCustomRows = new Set(customRows.value)
  if (choice === CUSTOM_VALUE) {
    nextCustomRows.add(index)
    rows[index] = ''
  } else {
    nextCustomRows.delete(index)
    rows[index] = choice
  }
  customRows.value = nextCustomRows
  updateRows(rows)
}

const setCustomSize = (index, size) => {
  const rows = normalizeRows(props.modelValue)
  rows[index] = size
  updateRows(rows)
}

const addSize = () => updateRows([...normalizeRows(props.modelValue), ''])

const removeSize = (index) => {
  const rows = normalizeRows(props.modelValue)
  rows.splice(index, 1)
  const nextCustomRows = new Set()
  customRows.value.forEach((rowIndex) => {
    if (rowIndex < index) nextCustomRows.add(rowIndex)
    if (rowIndex > index) nextCustomRows.add(rowIndex - 1)
  })
  customRows.value = nextCustomRows
  updateRows(rows)
}
</script>

<template>
  <div class="size-editor">
    <div v-for="(size, index) in normalizeRows(modelValue)" :key="index" class="size-row">
      <div class="size-inputs">
        <select
          :value="selectedChoice(size, index)"
          :disabled="disabled"
          :aria-label="`Size ${index + 1}`"
          @change="selectChoice(index, $event.target.value)"
        >
          <option value="">Select a shirt size</option>
          <option v-for="option in dropdownOptions.filter((option) => optionAvailable(option, index))" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <input
          v-if="customRows.has(index)"
          :value="size"
          type="text"
          placeholder="Type a custom size"
          :disabled="disabled"
          :aria-label="`Custom size ${index + 1}`"
          @input="setCustomSize(index, $event.target.value)"
        >
      </div>
      <button v-if="normalizeRows(modelValue).length > 1 || size" type="button" class="remove-size" :disabled="disabled" @click="removeSize(index)">Remove</button>
    </div>
    <button type="button" class="add-size" :disabled="disabled" @click="addSize">+ Add Size</button>
    <p class="size-hint">Choose a shirt size template or select Custom to enter another size.</p>
  </div>
</template>

<style scoped>
.size-editor, .size-inputs { display: flex; flex-direction: column; gap: 10px; }
.size-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 10px; }
select, input { width: 100%; border: 1px solid #cfd8cf; border-radius: 8px; padding: 12px; font: inherit; }
.add-size, .remove-size { width: fit-content; border: 0; border-radius: 8px; padding: 10px 14px; color: #fff; cursor: pointer; font: inherit; font-weight: 700; }
.add-size { background: var(--dashboard-green); }
.remove-size { background: var(--dashboard-red); }
button:disabled { cursor: not-allowed; opacity: 0.6; }
.size-hint { margin: 0; color: #666; font-size: 0.92rem; }
@media (max-width: 600px) { .size-row { grid-template-columns: 1fr; } }
</style>
