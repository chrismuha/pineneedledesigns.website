<script setup>
import { onMounted, ref } from 'vue'
import { dashboardApi } from '../../api/dashboard.js'

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = ref({ freeShippingEnabled: true, freeShippingMinimum: 28, fallbackShippingCost: 5 })

const loadSettings = async () => {
  loading.value = true
  error.value = ''
  try {
    const settings = await dashboardApi.getSettings()
    form.value = {
      freeShippingEnabled: Boolean(settings.freeShippingEnabled),
      freeShippingMinimum: settings.freeShippingMinimum ?? 28,
      fallbackShippingCost: settings.fallbackShippingCost ?? 5,
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const settings = await dashboardApi.updateSettings(form.value)
    form.value.freeShippingEnabled = Boolean(settings.freeShippingEnabled)
    form.value.freeShippingMinimum = settings.freeShippingMinimum ?? 28
    form.value.fallbackShippingCost = settings.fallbackShippingCost ?? 5
    success.value = 'Shipping settings saved.'
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="dashboard-page">
    <div class="page-header"><h1>Store Settings</h1></div>
    <p v-if="error" class="error-banner">{{ error }}</p>
    <p v-if="success" class="status-text">{{ success }}</p>
    <p v-if="loading" class="status-text">Loading settings...</p>
    <section v-else class="card">
      <div class="section-header"><h2>Shipping</h2></div>
      <label class="checkbox-row">
        <input v-model="form.freeShippingEnabled" type="checkbox">
        Offer free shipping after an order minimum
      </label>
      <div v-if="form.freeShippingEnabled" class="field">
        <label>Free Shipping Minimum (USD)</label>
        <input v-model.number="form.freeShippingMinimum" type="number" min="0" step="0.01" required>
        <p class="hint">Orders below this amount use the shipping costs entered on their items.</p>
      </div>
      <div class="field">
        <label>Fallback Shipping Charge (USD)</label>
        <input v-model.number="form.fallbackShippingCost" type="number" min="0" step="0.01" required>
        <p class="hint">Used for orders below the free-shipping minimum when their items do not have a shipping cost.</p>
      </div>
      <button type="button" class="btn-primary" :disabled="saving" @click="saveSettings">
        {{ saving ? 'Saving...' : 'Save Settings' }}
      </button>
    </section>
  </div>
</template>
