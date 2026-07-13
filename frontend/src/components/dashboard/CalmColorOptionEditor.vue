<script setup>
const calmColors = ['Pepper', 'Butter', 'Ivory', 'White', 'Natural White']

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const toggle = (color, checked) => {
  const selected = new Set(props.modelValue.map(String))
  if (checked) selected.add(color)
  else selected.delete(color)
  emit('update:modelValue', calmColors.filter((option) => selected.has(option)))
}
</script>

<template>
  <div class="calm-color-editor">
    <label v-for="color in calmColors" :key="color" class="calm-color-option">
      <input
        type="checkbox"
        :checked="modelValue.includes(color)"
        :disabled="disabled"
        @change="toggle(color, $event.target.checked)"
      >
      {{ color }}
    </label>
  </div>
</template>

<style scoped>
.calm-color-editor { display: flex; flex-wrap: wrap; gap: 10px 18px; }
.calm-color-option { display: inline-flex; align-items: center; gap: 7px; }
</style>
