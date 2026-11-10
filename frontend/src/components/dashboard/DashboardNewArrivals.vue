<script setup>
import { computed, onMounted, ref } from 'vue'
import { dashboardApi } from '../../api/dashboard.js'
import { catalogApi } from '../../api/catalog.js'
import { useCatalogStore } from '../../stores/catalog.js'
import {
  defaultNewArrivalsSettings, normalizeNewArrivalsSettings,
  newArrivalsCandidates, newArrivalsProductId, isNewArrivalsEligible, selectNewArrivals,
} from '../../utils/newArrivals.js'

const catalogStore = useCatalogStore()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const pages = ref([])
const form = ref(defaultNewArrivalsSettings())
const saved = ref('')
const search = ref('')
const total = computed(() => form.value.latestCount + form.value.customCount)
const valid = computed(() => [form.value.latestCount, form.value.customCount].every(Number.isInteger)
  && form.value.latestCount >= 0 && form.value.customCount >= 0 && total.value >= 1 && total.value <= 10
  && (form.value.mode === 'automatic' || form.value.productIds.length <= form.value.customCount))
const hasChanges = computed(() => JSON.stringify(form.value) !== saved.value)
const candidates = computed(() => newArrivalsCandidates(pages.value))
const byId = computed(() => new Map(candidates.value.map((product) => [newArrivalsProductId(product), product])))
const choices = computed(() => candidates.value.filter((product) =>
  `${product.title} ${product.collectionTitle}`.toLowerCase().includes(search.value.toLowerCase().trim()))
  .sort((left, right) => left.title.localeCompare(right.title)))
const selected = computed(() => form.value.productIds.map((id) => ({
  id, product: byId.value.get(id),
})))
const preview = computed(() => selectNewArrivals(pages.value, form.value))
const modes = [
  { value: 'automatic', label: 'Latest only', help: 'New products appear automatically, newest first.' },
  { value: 'mixed', label: 'Latest + custom', help: 'Reserve spaces for new products and your own picks.' },
  { value: 'manual', label: 'Custom only', help: 'Choose every product and its order.' },
]
const changeMode = (mode) => {
  form.value.mode = mode
  // Keep picks when switching modes so a customer can return to their selection.
  if (mode === 'automatic') {
    form.value.latestCount = 10
    form.value.customCount = 0
  } else if (mode === 'mixed') {
    form.value.customCount = Math.max(4, form.value.productIds.length)
    form.value.latestCount = Math.min(5, 10 - form.value.customCount)
  } else {
    form.value.latestCount = 0
    form.value.customCount = Math.max(1, form.value.productIds.length)
  }
}
const toggleProduct = (product) => {
  const id = newArrivalsProductId(product)
  if (form.value.productIds.includes(id)) form.value.productIds = form.value.productIds.filter((value) => value !== id)
  else if (form.value.productIds.length < form.value.customCount) form.value.productIds.push(id)
}
const movePick = (index, direction) => {
  const picks = [...form.value.productIds]
  const next = index + direction
  if (next < 0 || next >= picks.length) return
  ;[picks[index], picks[next]] = [picks[next], picks[index]]
  form.value.productIds = picks
}
const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [settings, catalog] = await Promise.all([
      dashboardApi.getSettings(), catalogApi.getCatalog({ cache: 'no-store' }),
    ])
    pages.value = catalog.collectionPages || []
    form.value = normalizeNewArrivalsSettings(settings.newArrivals)
    saved.value = JSON.stringify(form.value)
  } catch (cause) { error.value = cause.message || 'Could not load New Arrivals.' }
  finally { loading.value = false }
}
const save = async () => {
  if (!valid.value || saving.value || !hasChanges.value) return
  saving.value = true
  error.value = ''
  try {
    const config = { ...form.value, productIds: form.value.mode === 'automatic' ? [] : [...form.value.productIds] }
    const result = await dashboardApi.updateNewArrivals(config)
    form.value = normalizeNewArrivalsSettings(result)
    saved.value = JSON.stringify(form.value)
    catalogStore.collectionPages = pages.value
    catalogStore.newArrivalsSettings = { ...form.value }
  } catch (cause) { error.value = cause.message || 'Could not save New Arrivals.' }
  finally { saving.value = false }
}
onMounted(load)
</script>

<template>
  <section class="arrivals-settings" aria-labelledby="new-arrivals-heading">
    <div class="arrivals-heading">
      <i class="bi bi-stars" aria-hidden="true"></i>
      <div><h2 id="new-arrivals-heading">New Arrivals</h2><p>Choose what customers see on the homepage. Show 1–10 items in total.</p></div>
    </div>
    <p v-if="loading" role="status">Loading New Arrivals settings…</p>
    <p v-if="error" class="arrivals-error" role="alert">{{ error }} <button v-if="!saved && !loading" type="button" class="btn-outline" @click="load">Try again</button></p>
    <form v-if="!loading && saved" @submit.prevent="save">
      <fieldset :disabled="saving">
        <legend class="visually-hidden">New Arrivals settings</legend>
        <label class="arrivals-toggle"><input v-model="form.enabled" type="checkbox"> Show New Arrivals on the homepage</label>
        <fieldset class="arrivals-modes">
          <legend>Which items should appear?</legend>
          <label v-for="mode in modes" :key="mode.value" :class="{ selected: form.mode === mode.value }">
            <input type="radio" name="new-arrivals-mode" :value="mode.value" :checked="form.mode === mode.value" @change="changeMode(mode.value)">
            <span><strong>{{ mode.label }}</strong><small>{{ mode.help }}</small></span>
          </label>
        </fieldset>
        <div class="arrivals-counts">
          <label v-if="form.mode !== 'manual'">Latest items
            <input v-model.number="form.latestCount" type="number" :min="form.mode === 'automatic' ? 1 : 0" max="10" step="1" inputmode="numeric" required>
          </label>
          <label v-if="form.mode !== 'automatic'">Custom items
            <input v-model.number="form.customCount" type="number" :min="form.mode === 'manual' ? 1 : 0" max="10" step="1" inputmode="numeric" required>
          </label>
          <p aria-live="polite">{{ total }} of 10 spaces</p>
        </div>
        <p v-if="total < 1 || total > 10" class="arrivals-error" role="alert">Choose between 1 and 10 total items.</p>
        <p class="arrivals-help">Only available products with a photo appear. Latest items update automatically. Custom picks stay selected until you remove them; sold or removed products are skipped.</p>
        <template v-if="form.mode !== 'automatic'">
          <h3>Your custom picks ({{ form.productIds.length }}/{{ form.customCount }})</h3>
          <p v-if="form.productIds.length > form.customCount" class="arrivals-error" role="alert">Remove extra picks or increase custom spaces, keeping the total at 10 or fewer.</p>
          <ol class="arrivals-picks">
            <li v-for="(pick, index) in selected" :key="pick.id">
              <span>{{ pick.product?.title || 'Unavailable product' }}<small v-if="!pick.product || !isNewArrivalsEligible(pick.product)">Currently unavailable; skipped on the homepage.</small></span>
              <button type="button" class="btn-outline" :disabled="index === 0" :aria-label="`Move ${pick.product?.title || 'pick'} earlier`" @click="movePick(index, -1)">↑</button>
              <button type="button" class="btn-outline" :disabled="index === selected.length - 1" :aria-label="`Move ${pick.product?.title || 'pick'} later`" @click="movePick(index, 1)">↓</button>
              <button type="button" class="btn-outline" @click="form.productIds = form.productIds.filter(id => id !== pick.id)">Remove</button>
            </li>
          </ol>
          <label class="arrivals-search">Find products<input v-model="search" type="search" placeholder="Search by product or collection"></label>
          <div class="arrivals-choices" aria-label="Choose custom products">
            <label v-for="product in choices" :key="newArrivalsProductId(product)">
              <input type="checkbox" :checked="form.productIds.includes(newArrivalsProductId(product))" :disabled="!form.productIds.includes(newArrivalsProductId(product)) && (!isNewArrivalsEligible(product) || form.productIds.length >= form.customCount)" @change="toggleProduct(product)">
              <img v-if="product.images?.length" :src="product.images[0]" alt="" loading="lazy">
              <span><strong>{{ product.title }}</strong><small>{{ product.collectionTitle }}{{ isNewArrivalsEligible(product) ? '' : ' · Unavailable or missing photo' }}</small></span>
            </label>
            <p v-if="!choices.length">No matching products.</p>
          </div>
          <p v-if="form.productIds.length < form.customCount" class="arrivals-help">{{ form.customCount - form.productIds.length }} custom spaces are unfilled. These spaces stay empty until you choose products.</p>
        </template>
        <div class="arrivals-preview" aria-live="polite">
          <h3>Homepage preview · {{ preview.length }} items</h3>
          <p v-if="!form.enabled">New Arrivals is hidden.</p>
          <ol v-else-if="preview.length"><li v-for="product in preview" :key="newArrivalsProductId(product)">{{ product.title }}</li></ol>
          <p v-else>No available items match these settings. New Arrivals stays hidden until there are items to show.</p>
          <p v-if="form.mode === 'mixed'">Latest products appear first, followed by your custom picks. Each product appears once.</p>
        </div>
        <button type="submit" class="btn-primary" :disabled="!valid || !hasChanges || saving">{{ saving ? 'Saving…' : 'Save New Arrivals' }}</button>
        <span v-if="!hasChanges" class="arrivals-help">Settings saved.</span>
      </fieldset>
    </form>
  </section>
</template>

<style scoped>
.arrivals-settings { padding: clamp(18px, 4vw, 26px); margin-bottom: 24px; border: 1px solid var(--dashboard-settings-setting-field-border); border-radius: 18px; background: var(--dashboard-settings-settings-card-surface); color: var(--dashboard-settings-setting-field-label-text); }
.arrivals-heading { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
.arrivals-heading > i { color: var(--dashboard-primary-action-color); font-size: 1.8rem; }
h2, h3, p { margin: 0 0 12px; }
h2 { font-size: 1.5rem; } h3 { font-size: 1.05rem; margin-top: 20px; }
fieldset { min-width: 0; padding: 0; margin: 0; border: 0; }
.arrivals-toggle { display: flex; align-items: center; gap: 10px; font-weight: 700; margin-bottom: 20px; }
input { accent-color: var(--dashboard-primary-action-color); }
.arrivals-modes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 20px; }
.arrivals-modes legend { font-weight: 700; margin-bottom: 12px; }
.arrivals-modes label { display: flex; align-items: flex-start; gap: 8px; border: 1px solid var(--dashboard-settings-setting-field-border); border-radius: 12px; padding: 14px; cursor: pointer; }
.arrivals-modes .selected { border-color: var(--dashboard-primary-action-color); background: var(--dashboard-primary-action-soft-surface); }
strong, small { display: block; overflow-wrap: anywhere; }
small, .arrivals-help, .arrivals-heading p { font-size: .9rem; line-height: 1.5; color: var(--dashboard-settings-setting-field-p-text); }
.arrivals-counts { display: flex; align-items: end; flex-wrap: wrap; gap: 16px; }
.arrivals-counts label { display: grid; gap: 6px; font-weight: 700; }
.arrivals-counts input { width: 90px; }
input[type=number], input[type=search] { min-height: 44px; border: 1px solid var(--dashboard-settings-setting-field-border); border-radius: 8px; background: var(--dashboard-settings-settings-card-surface); color: inherit; padding: 10px; box-sizing: border-box; }
.arrivals-help { margin-top: 12px; }
.arrivals-error { color: var(--dashboard-primary-action-color); font-weight: 700; }
.arrivals-search { display: grid; gap: 8px; font-weight: 700; margin: 18px 0 12px; }
.arrivals-choices { max-height: 420px; overflow-y: auto; border: 1px solid var(--dashboard-settings-setting-field-border); border-radius: 12px; }
.arrivals-choices label { display: flex; align-items: center; gap: 12px; padding: 14px; border-bottom: 1px solid var(--dashboard-settings-setting-field-border); cursor: pointer; }
.arrivals-choices img { width: 48px; height: 60px; object-fit: contain; flex-shrink: 0; }
.arrivals-choices input { width: 20px; height: 20px; flex-shrink: 0; }
.arrivals-picks { padding-left: 24px; }
.arrivals-picks li { padding: 10px 0; display: flex; gap: 8px; align-items: center; }
.arrivals-picks li > span { flex: 1; min-width: 0; }
.arrivals-picks button { min-width: 44px; min-height: 44px; padding: 8px; }
.arrivals-preview { margin: 20px 0; padding: 16px; border-radius: 12px; background: var(--dashboard-primary-action-soft-surface); line-height: 1.6; }
.arrivals-preview h3 { margin-top: 0; }
.arrivals-preview ol { padding-left: 24px; }
.arrivals-preview p { margin-bottom: 0; }
@media (max-width: 650px) { .arrivals-modes { grid-template-columns: 1fr; } .arrivals-picks li { flex-wrap: wrap; } .arrivals-picks li > span { flex-basis: 100%; } }
</style>
