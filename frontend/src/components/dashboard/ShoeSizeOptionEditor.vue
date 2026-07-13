<script setup>
const shoeSizes = Array.from({ length: 7 }, (_, index) => String(index + 6))

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const toggleSize = (size) => {
  const selected = new Set(props.modelValue.map(String))
  if (selected.has(size)) selected.delete(size)
  else selected.add(size)
  emit('update:modelValue', shoeSizes.filter((option) => selected.has(option)))
}
</script>

<template>
  <div class="shoe-size-editor">
    <label v-for="size in shoeSizes" :key="size" class="shoe-size-option">
      <input
        type="checkbox"
        :checked="modelValue.map(String).includes(size)"
        :disabled="disabled"
        @change="toggleSize(size)"
      >
      <span>{{ size }}</span>
    </label>
  </div>
</template>

<style scoped>
.shoe-size-editor { display: flex; flex-wrap: wrap; gap: 10px; }
.shoe-size-option { display: inline-flex; align-items: center; gap: 7px; min-width: 58px; padding: 10px 12px; border: 1px solid #cfd8cf; border-radius: 8px; background: #fff; cursor: pointer; font-weight: 700; }
.shoe-size-option:has(input:checked) { border-color: var(--dashboard-green); background: var(--dashboard-green-bg, #eef8f0); }
.shoe-size-option input { width: auto; margin: 0; }
</style>
