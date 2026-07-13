<script setup>
import { ref, watch } from 'vue'

const comfortColors = ['Pepper', 'Butter', 'Ivory', 'White', 'Natural White']
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
  (colors) => {
    const next = new Set(customRows.value)
    ;(colors?.length ? colors : ['']).forEach((color, index) => {
      if (color && !comfortColors.includes(String(color))) next.add(index)
    })
    customRows.value = next
  },
  { immediate: true, deep: true },
)

const updateRows = (values) => emit('update:modelValue', values.length ? values : [''])
const selectedChoice = (color, index) => customRows.value.has(index) ? CUSTOM_VALUE : (comfortColors.includes(color) ? color : '')
const optionAvailable = (color, index) => selectedChoice(rows()[index], index) === color || !rows().includes(color)

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

const setCustomColor = (index, color) => {
  const values = rows()
  values[index] = color
  updateRows(values)
}

const addColor = () => updateRows([...rows(), ''])
const removeColor = (index) => {
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
  <div class="comfort-color-editor">
    <div v-for="(color, index) in rows()" :key="index" class="comfort-color-row">
      <div class="color-inputs">
        <select :value="selectedChoice(color, index)" :disabled="disabled" :aria-label="`Comfort color ${index + 1}`" @change="selectChoice(index, $event.target.value)">
          <option value="">Select a comfort color</option>
          <option v-for="option in comfortColors.filter((item) => optionAvailable(item, index))" :key="option" :value="option">{{ option }}</option>
          <option :value="CUSTOM_VALUE">Custom Color…</option>
        </select>
        <input v-if="customRows.has(index)" :value="color" type="text" maxlength="80" placeholder="Type a custom comfort color" :disabled="disabled" :aria-label="`Custom comfort color ${index + 1}`" @input="setCustomColor(index, $event.target.value)">
      </div>
      <button v-if="rows().length > 1 || color" type="button" class="remove-color" :disabled="disabled" @click="removeColor(index)">Remove</button>
    </div>
    <button type="button" class="add-color" :disabled="disabled" @click="addColor">+ Add Comfort Color</button>
    <p class="color-hint">Choose a preset or select Custom Color to enter another comfort color.</p>
  </div>
</template>

<style scoped>
.comfort-color-editor, .color-inputs { display: flex; flex-direction: column; gap: 10px; }
.comfort-color-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 10px; }
select, input { width: 100%; border: 1px solid #cfd8cf; border-radius: 8px; padding: 12px; font: inherit; }
.add-color, .remove-color { width: fit-content; border: 0; border-radius: 8px; padding: 10px 14px; color: #fff; cursor: pointer; font: inherit; font-weight: 700; }
.add-color { background: var(--dashboard-green); }
.remove-color { background: var(--dashboard-red); }
button:disabled { cursor: not-allowed; opacity: 0.6; }
.color-hint { margin: 0; color: #666; font-size: 0.92rem; }
@media (max-width: 600px) { .comfort-color-row { grid-template-columns: 1fr; } }
</style>
