<script setup>
import { computed, ref, watch } from 'vue'
import { shirtColorTemplates } from '../../data/siteData.js'

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
  ...shirtColorTemplates.map((color) => ({ label: color, value: color })),
  { label: 'Custom…', value: CUSTOM_VALUE },
].sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true })))

const normalizeRows = (colors) => (colors?.length ? colors.map((color) => String(color || '')) : [''])

watch(
  () => props.modelValue,
  (colors) => {
    const nextCustomRows = new Set(customRows.value)
    normalizeRows(colors).forEach((color, index) => {
      if (color && !shirtColorTemplates.includes(color)) nextCustomRows.add(index)
    })
    customRows.value = nextCustomRows
  },
  { immediate: true, deep: true },
)

const selectedChoice = (color, index) => {
  if (customRows.value.has(index)) return CUSTOM_VALUE
  return shirtColorTemplates.includes(color) ? color : ''
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

const setCustomColor = (index, color) => {
  const rows = normalizeRows(props.modelValue)
  rows[index] = color
  updateRows(rows)
}

const addColor = () => updateRows([...normalizeRows(props.modelValue), ''])

const removeColor = (index) => {
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
  <div class="color-editor">
    <div v-for="(color, index) in normalizeRows(modelValue)" :key="index" class="color-row">
      <div class="color-inputs">
        <select
          :value="selectedChoice(color, index)"
          :disabled="disabled"
          :aria-label="`Color ${index + 1}`"
          @change="selectChoice(index, $event.target.value)"
        >
          <option value="">Select a shirt color</option>
          <option v-for="option in dropdownOptions.filter((option) => optionAvailable(option, index))" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <input
          v-if="customRows.has(index)"
          :value="color"
          type="text"
          placeholder="Type a custom color"
          :disabled="disabled"
          :aria-label="`Custom color ${index + 1}`"
          @input="setCustomColor(index, $event.target.value)"
        >
      </div>

      <button v-if="normalizeRows(modelValue).length > 1 || color" type="button" class="remove-color" :disabled="disabled" @click="removeColor(index)">
        Remove
      </button>
    </div>

    <button type="button" class="add-color" :disabled="disabled" @click="addColor">
      + Add Color
    </button>
    <p class="color-hint">Choose a shirt color template or select Custom to enter another color.</p>
  </div>
</template>

<style scoped>
.color-editor,
.color-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px;
}

select,
input {
  width: 100%;
  border: 1px solid #cfd8cf;
  border-radius: 8px;
  padding: 12px;
  font: inherit;
}

.add-color,
.remove-color {
  width: fit-content;
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.add-color { background: var(--dashboard-green); }
.remove-color { background: var(--dashboard-red); }

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.color-hint {
  margin: 0;
  color: #666;
  font-size: 0.92rem;
}

@media (max-width: 600px) {
  .color-row { grid-template-columns: 1fr; }
}
</style>
