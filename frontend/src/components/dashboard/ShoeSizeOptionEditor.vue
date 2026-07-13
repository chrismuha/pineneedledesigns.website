<script setup>
import { ref, watch } from 'vue'

const shoeSizes = Array.from({ length: 7 }, (_, index) => String(index + 6))
const CUSTOM_VALUE = '__custom__'

const props = defineProps({
  modelValue: { type: Array, default: () => [''] },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const customRows = ref(new Set())
const rows = () => (props.modelValue.length ? props.modelValue.map(String) : [''])

watch(
  () => props.modelValue,
  (sizes) => {
    const next = new Set(customRows.value)
    ;(sizes?.length ? sizes : ['']).forEach((size, index) => {
      if (size && !shoeSizes.includes(String(size))) next.add(index)
    })
    customRows.value = next
  },
  { immediate: true, deep: true },
)

const updateRows = (values) => emit('update:modelValue', values.length ? values : [''])
const selectedChoice = (size, index) => customRows.value.has(index) ? CUSTOM_VALUE : (shoeSizes.includes(size) ? size : '')
const optionAvailable = (size, index) => selectedChoice(rows()[index], index) === size || !rows().includes(size)

const selectChoice = (index, choice) => {
  const values = rows()
  const next = new Set(customRows.value)
  if (choice === CUSTOM_VALUE) {
    next.add(index)
    values[index] = ''
  } else {
    next.delete(index)
    values[index] = choice
  }
  customRows.value = next
  updateRows(values)
}

const setCustomSize = (index, size) => {
  const values = rows()
  values[index] = size
  updateRows(values)
}

const addSize = () => updateRows([...rows(), ''])
const removeSize = (index) => {
  const values = rows()
  values.splice(index, 1)
  const next = new Set()
  customRows.value.forEach((rowIndex) => {
    if (rowIndex < index) next.add(rowIndex)
    if (rowIndex > index) next.add(rowIndex - 1)
  })
  customRows.value = next
  updateRows(values)
}
</script>

<template>
  <div class="shoe-size-editor">
    <div v-for="(size, index) in rows()" :key="index" class="shoe-size-row">
      <div class="size-inputs">
        <select :value="selectedChoice(size, index)" :disabled="disabled" :aria-label="`Shoe size ${index + 1}`" @change="selectChoice(index, $event.target.value)">
          <option value="">Select a shoe size</option>
          <option v-for="option in shoeSizes.filter((item) => optionAvailable(item, index))" :key="option" :value="option">{{ option }}</option>
          <option :value="CUSTOM_VALUE">Custom Size / Measurement…</option>
        </select>
        <input v-if="customRows.has(index)" :value="size" type="text" placeholder="Type a custom size or measurement" :disabled="disabled" :aria-label="`Custom shoe size ${index + 1}`" @input="setCustomSize(index, $event.target.value)">
      </div>
      <button v-if="rows().length > 1 || size" type="button" class="remove-size" :disabled="disabled" @click="removeSize(index)">Remove</button>
    </div>
    <button type="button" class="add-size" :disabled="disabled" @click="addSize">+ Add Shoe Size</button>
  </div>
</template>

<style scoped>
.shoe-size-editor, .size-inputs { display: flex; flex-direction: column; gap: 10px; }
.shoe-size-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 10px; }
select, input { width: 100%; border: 1px solid #cfd8cf; border-radius: 8px; padding: 12px; font: inherit; }
.add-size, .remove-size { width: fit-content; border: 0; border-radius: 8px; padding: 10px 14px; color: #fff; cursor: pointer; font: inherit; font-weight: 700; }
.add-size { background: var(--dashboard-green); }
.remove-size { background: var(--dashboard-red); }
button:disabled { cursor: not-allowed; opacity: 0.6; }
@media (max-width: 600px) { .shoe-size-row { grid-template-columns: 1fr; } }
</style>
