<script setup>
import { computed, ref, watch } from 'vue'
import SizeOptionEditor from './SizeOptionEditor.vue'
import ShoeSizeOptionEditor from './ShoeSizeOptionEditor.vue'
import BeltSizeOptionEditor from './BeltSizeOptionEditor.vue'

const props = defineProps({
  primaryLabel: { type: String, default: 'Size' },
  primarySizes: { type: Array, default: () => [''] },
  sweatshirtSizes: { type: Array, default: () => [''] },
  shoeSizes: { type: Array, default: () => [''] },
  beltSizes: { type: Array, default: () => [''] },
  collectionSlug: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:primarySizes',
  'update:sweatshirtSizes',
  'update:shoeSizes',
  'update:beltSizes',
])

const hasValues = (values) => values?.some((value) => String(value || '').trim())
const defaultType = () => {
  if (hasValues(props.sweatshirtSizes)) return 'sweatshirt'
  if (hasValues(props.shoeSizes)) return 'shoe'
  if (hasValues(props.beltSizes)) return 'belt'
  if (hasValues(props.primarySizes)) return 'primary'
  if (props.collectionSlug === 'shoes') return 'shoe'
  if (props.collectionSlug === 'belts') return 'belt'
  return 'primary'
}

const selectedType = ref(defaultType())
watch(
  () => [props.collectionSlug, props.primarySizes, props.sweatshirtSizes, props.shoeSizes, props.beltSizes],
  () => {
    const selectedValues = {
      primary: props.primarySizes,
      sweatshirt: props.sweatshirtSizes,
      shoe: props.shoeSizes,
      belt: props.beltSizes,
    }[selectedType.value]
    const anyValues = [props.primarySizes, props.sweatshirtSizes, props.shoeSizes, props.beltSizes]
      .some(hasValues)
    if (!hasValues(selectedValues) && anyValues) selectedType.value = defaultType()
  },
  { deep: true },
)

const sweatshirtLabel = computed(() => (
  props.collectionSlug === 'sweaters' ? 'Sweater Size' : 'Sweatshirt Size'
))

const selectType = (type) => {
  selectedType.value = type
  emit('update:primarySizes', type === 'primary' ? props.primarySizes : [''])
  emit('update:sweatshirtSizes', type === 'sweatshirt' ? props.sweatshirtSizes : [''])
  emit('update:shoeSizes', type === 'shoe' ? props.shoeSizes : [''])
  emit('update:beltSizes', type === 'belt' ? props.beltSizes : [''])
}
</script>

<template>
  <div class="dashboard-size-selector">
    <label>Size Type</label>
    <select :value="selectedType" :disabled="disabled" @change="selectType($event.target.value)">
      <option value="primary">{{ primaryLabel }}</option>
      <option value="sweatshirt">{{ sweatshirtLabel }}</option>
      <option value="shoe">Shoe Size</option>
      <option value="belt">Belt Size</option>
    </select>

    <div class="size-options">
      <label>{{ selectedType === 'primary' ? `${primaryLabel}s` : selectedType === 'sweatshirt' ? `${sweatshirtLabel}s` : selectedType === 'shoe' ? 'Shoe Sizes' : 'Belt Sizes' }}</label>
      <SizeOptionEditor
        v-if="selectedType === 'primary'"
        :model-value="primarySizes"
        :disabled="disabled"
        :label="primaryLabel.toLowerCase()"
        @update:model-value="$emit('update:primarySizes', $event)"
      />
      <SizeOptionEditor
        v-else-if="selectedType === 'sweatshirt'"
        :model-value="sweatshirtSizes"
        :disabled="disabled"
        :label="sweatshirtLabel.toLowerCase()"
        @update:model-value="$emit('update:sweatshirtSizes', $event)"
      />
      <ShoeSizeOptionEditor
        v-else-if="selectedType === 'shoe'"
        :model-value="shoeSizes"
        :disabled="disabled"
        @update:model-value="$emit('update:shoeSizes', $event)"
      />
      <BeltSizeOptionEditor
        v-else
        :model-value="beltSizes"
        :disabled="disabled"
        @update:model-value="$emit('update:beltSizes', $event)"
      />
    </div>
    <p class="hint">Only the selected size type is shown to customers.</p>
  </div>
</template>

<style scoped>
.dashboard-size-selector { display: flex; flex-direction: column; gap: 10px; }
.dashboard-size-selector > select { width: 100%; border: 1px solid var(--size-option-editor-input-border); border-radius: 8px; padding: 12px; font: inherit; }
.size-options { display: flex; flex-direction: column; gap: 8px; }
.hint { margin: 0; }
</style>
