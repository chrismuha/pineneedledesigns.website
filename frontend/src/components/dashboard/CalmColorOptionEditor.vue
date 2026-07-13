<script setup>
const calmColors = ['Pepper', 'Butter', 'Ivory', 'White', 'Natural White']

const props = defineProps({
  modelValue: { type: Array, default: () => [''] },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const rows = () => (props.modelValue.length ? props.modelValue.map(String) : [''])
const updateRows = (values) => emit('update:modelValue', values.length ? values : [''])

const updateColor = (index, color) => {
  const values = rows()
  values[index] = color
  updateRows(values)
}

const addColor = () => updateRows([...rows(), ''])

const removeColor = (index) => {
  const values = rows()
  values.splice(index, 1)
  updateRows(values)
}

const optionAvailable = (color, index) => rows()[index] === color || !rows().includes(color)
</script>

<template>
  <div class="calm-color-editor">
    <div v-for="(color, index) in rows()" :key="index" class="calm-color-row">
      <select
        :value="color"
        :disabled="disabled"
        :aria-label="`Calm color ${index + 1}`"
        @change="updateColor(index, $event.target.value)"
      >
        <option value="">Select a calm color</option>
        <option v-for="option in calmColors.filter((item) => optionAvailable(item, index))" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
      <button v-if="rows().length > 1 || color" type="button" class="remove-color" :disabled="disabled" @click="removeColor(index)">Remove</button>
    </div>
    <button v-if="rows().length < calmColors.length" type="button" class="add-color" :disabled="disabled" @click="addColor">+ Add Calm Color</button>
  </div>
</template>

<style scoped>
.calm-color-editor { display: flex; flex-direction: column; gap: 10px; }
.calm-color-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }
select { width: 100%; border: 1px solid #cfd8cf; border-radius: 8px; padding: 12px; font: inherit; }
.add-color, .remove-color { width: fit-content; border: 0; border-radius: 8px; padding: 10px 14px; color: #fff; cursor: pointer; font: inherit; font-weight: 700; }
.add-color { background: var(--dashboard-green); }
.remove-color { background: var(--dashboard-red); }
button:disabled { cursor: not-allowed; opacity: 0.6; }
@media (max-width: 600px) { .calm-color-row { grid-template-columns: 1fr; } }
</style>
