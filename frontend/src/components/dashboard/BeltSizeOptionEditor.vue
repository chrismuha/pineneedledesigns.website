<script setup>
const beltSizes = [
  'Small',
  'Medium',
  'Large',
  '2XL',
  '3XL',
  ...Array.from({ length: 13 }, (_, index) => String(28 + (index * 2))),
]

const props = defineProps({
  modelValue: { type: Array, default: () => [''] },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const rows = () => (props.modelValue.length ? props.modelValue.map(String) : [''])
const updateRows = (values) => emit('update:modelValue', values.length ? values : [''])

const updateSize = (index, size) => {
  const values = rows()
  values[index] = size
  updateRows(values)
}

const addSize = () => updateRows([...rows(), ''])

const removeSize = (index) => {
  const values = rows()
  values.splice(index, 1)
  updateRows(values)
}

const optionAvailable = (size, index) => rows()[index] === size || !rows().includes(size)
</script>

<template>
  <div class="belt-size-editor">
    <div v-for="(size, index) in rows()" :key="index" class="belt-size-row">
      <select
        :value="size"
        :disabled="disabled"
        :aria-label="`Belt size ${index + 1}`"
        @change="updateSize(index, $event.target.value)"
      >
        <option value="">Select a belt size</option>
        <option v-for="option in beltSizes.filter((item) => optionAvailable(item, index))" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
      <button v-if="rows().length > 1 || size" type="button" class="remove-size" :disabled="disabled" @click="removeSize(index)">Remove</button>
    </div>
    <button v-if="rows().length < beltSizes.length" type="button" class="add-size" :disabled="disabled" @click="addSize">+ Add Belt Size</button>
  </div>
</template>

<style scoped>
.belt-size-editor { display: flex; flex-direction: column; gap: 10px; }
.belt-size-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }
select { width: 100%; border: 1px solid #cfd8cf; border-radius: 8px; padding: 12px; font: inherit; }
.add-size, .remove-size { width: fit-content; border: 0; border-radius: 8px; padding: 10px 14px; color: #fff; cursor: pointer; font: inherit; font-weight: 700; }
.add-size { background: var(--dashboard-green); }
.remove-size { background: var(--dashboard-red); }
button:disabled { cursor: not-allowed; opacity: 0.6; }
@media (max-width: 600px) { .belt-size-row { grid-template-columns: 1fr; } }
</style>
