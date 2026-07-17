<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { dashboardApi } from '../../api/dashboard.js'
import {
  clearDashboardAppearancePreviews,
  getDashboardDarkPhotoEditorEnabled,
  getDashboardFooterButtonDepthEnabled,
  getDashboardLiquidGlassEnabled,
  getDashboardLiquidGlassIntensity,
  previewDashboardDarkPhotoEditor,
  previewDashboardFooterButtonDepth,
  previewDashboardLiquidGlass,
  previewDashboardLiquidGlassIntensity,
  setDashboardDarkPhotoEditorEnabled,
  setDashboardFooterButtonDepthEnabled,
  setDashboardLiquidGlassEnabled,
  setDashboardLiquidGlassIntensity,
} from '../../utils/dashboardAppearance.js'
import { setDashboardToastTimeout, showDashboardToast } from '../../utils/dashboardToast.js'
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushState,
  sendTestPushNotification,
} from '../../utils/pushNotifications.js'

const loading = ref(true)
const saving = ref(false)
const pushBusy = ref(false)
const pushState = ref({ supported: true, subscribed: false, permission: 'default' })
const error = ref('')
const form = ref({
  freeShippingEnabled: true,
  freeShippingMinimum: 28,
  fallbackShippingCost: 5,
  toastTimeoutSeconds: 6,
  liquidGlassEnabled: getDashboardLiquidGlassEnabled(),
  liquidGlassIntensity: getDashboardLiquidGlassIntensity(),
  darkPhotoEditorEnabled: getDashboardDarkPhotoEditorEnabled(),
  footerButtonDepthEnabled: getDashboardFooterButtonDepthEnabled(),
})
const savedSettings = ref('')
const settingsSnapshot = (settings) => JSON.stringify({
  freeShippingEnabled: Boolean(settings.freeShippingEnabled),
  freeShippingMinimum: Number(settings.freeShippingMinimum),
  fallbackShippingCost: Number(settings.fallbackShippingCost),
  toastTimeoutSeconds: Number(settings.toastTimeoutSeconds),
  liquidGlassEnabled: Boolean(settings.liquidGlassEnabled),
  liquidGlassIntensity: Number(settings.liquidGlassIntensity),
  darkPhotoEditorEnabled: Boolean(settings.darkPhotoEditorEnabled),
  footerButtonDepthEnabled: Boolean(settings.footerButtonDepthEnabled),
})
const hasChanges = computed(() => settingsSnapshot(form.value) !== savedSettings.value)

const refreshPushState = async () => {
  try {
    pushState.value = await getPushState()
  } catch {
    pushState.value = { supported: false, subscribed: false, permission: 'unsupported' }
  }
}

const togglePush = async () => {
  pushBusy.value = true
  error.value = ''
  try {
    if (pushState.value.subscribed) {
      await disablePushNotifications()
      showDashboardToast('Phone notifications were turned off on this device.', { type: 'success' })
    } else {
      await enablePushNotifications()
      showDashboardToast('This device will now receive new order and booking alerts.', { type: 'success' })
    }
    await refreshPushState()
  } catch (err) {
    error.value = err.message
    showDashboardToast(err.message, { title: 'Notifications unavailable' })
  } finally {
    pushBusy.value = false
  }
}

const testPush = async () => {
  pushBusy.value = true
  try {
    await sendTestPushNotification()
    showDashboardToast('Test sent. It should appear as a phone notification shortly.', { type: 'success' })
  } catch (err) {
    showDashboardToast(err.message, { title: 'Test failed' })
  } finally {
    pushBusy.value = false
  }
}

watch(() => form.value.liquidGlassEnabled, previewDashboardLiquidGlass)
watch(() => form.value.liquidGlassIntensity, previewDashboardLiquidGlassIntensity)
watch(() => form.value.darkPhotoEditorEnabled, previewDashboardDarkPhotoEditor)
watch(() => form.value.footerButtonDepthEnabled, previewDashboardFooterButtonDepth)

const loadSettings = async () => {
  loading.value = true
  error.value = ''
  try {
    const settings = await dashboardApi.getSettings()
    form.value = {
      freeShippingEnabled: Boolean(settings.freeShippingEnabled),
      freeShippingMinimum: settings.freeShippingMinimum ?? 28,
      fallbackShippingCost: settings.fallbackShippingCost ?? 5,
      toastTimeoutSeconds: settings.toastTimeoutSeconds ?? 6,
      liquidGlassEnabled: getDashboardLiquidGlassEnabled(),
      liquidGlassIntensity: getDashboardLiquidGlassIntensity(),
      darkPhotoEditorEnabled: getDashboardDarkPhotoEditorEnabled(),
      footerButtonDepthEnabled: getDashboardFooterButtonDepthEnabled(),
    }
    setDashboardToastTimeout(form.value.toastTimeoutSeconds)
    savedSettings.value = settingsSnapshot(form.value)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  if (!hasChanges.value) {
    showDashboardToast('These settings already match the saved values.', {
      type: 'warning',
      title: 'No changes to save',
    })
    return
  }

  saving.value = true
  error.value = ''
  try {
    const settings = await dashboardApi.updateSettings(form.value)
    form.value.freeShippingEnabled = Boolean(settings.freeShippingEnabled)
    form.value.freeShippingMinimum = settings.freeShippingMinimum ?? 28
    form.value.fallbackShippingCost = settings.fallbackShippingCost ?? 5
    form.value.toastTimeoutSeconds = settings.toastTimeoutSeconds ?? 6
    setDashboardToastTimeout(form.value.toastTimeoutSeconds)
    setDashboardLiquidGlassEnabled(form.value.liquidGlassEnabled)
    setDashboardLiquidGlassIntensity(form.value.liquidGlassIntensity)
    setDashboardDarkPhotoEditorEnabled(form.value.darkPhotoEditorEnabled)
    setDashboardFooterButtonDepthEnabled(form.value.footerButtonDepthEnabled)
    savedSettings.value = settingsSnapshot(form.value)
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
  refreshPushState()
})
onBeforeUnmount(clearDashboardAppearancePreviews)
</script>

<template>
  <div class="dashboard-page settings-page">
    <div class="settings-heading">
      <div class="settings-heading__icon" aria-hidden="true"><i class="bi bi-sliders"></i></div>
      <div>
        <h1>Store Settings</h1>
        <p>Manage checkout and dashboard preferences.</p>
      </div>
    </div>
    <p v-if="loading" class="status-text">Loading settings...</p>
    <section v-else class="settings-card">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Checkout</span>
          <h2>Shipping</h2>
        </div>
        <i class="bi bi-truck" aria-hidden="true"></i>
      </div>

      <label class="toggle-row">
        <span>
          <strong>Free-shipping threshold</strong>
          <small>Automatically offer free shipping when an order reaches your minimum.</small>
        </span>
        <input v-model="form.freeShippingEnabled" class="toggle-input" type="checkbox" role="switch">
      </label>

      <div class="settings-fields">
        <div v-if="form.freeShippingEnabled" class="setting-field">
          <label for="free-shipping-minimum">Free shipping minimum</label>
          <div class="money-input">
            <span aria-hidden="true">$</span>
            <input id="free-shipping-minimum" v-model.number="form.freeShippingMinimum" type="number" min="0" step="0.01" inputmode="decimal" required>
            <span>USD</span>
          </div>
          <p>Orders below this amount use each item's shipping cost.</p>
        </div>

        <div class="setting-field">
          <label for="fallback-shipping-cost">Fallback shipping charge</label>
          <div class="money-input">
            <span aria-hidden="true">$</span>
            <input id="fallback-shipping-cost" v-model.number="form.fallbackShippingCost" type="number" min="0" step="0.01" inputmode="decimal" required>
            <span>USD</span>
          </div>
          <p>Used when an item has no shipping cost and the order does not qualify for free shipping.</p>
        </div>
      </div>

      <div class="notification-settings">
        <div class="notification-settings__heading">
          <i class="bi bi-bell" aria-hidden="true"></i>
          <div>
            <strong>Toast notification timeout</strong>
            <p>Choose how long dashboard messages remain visible.</p>
          </div>
        </div>
        <label for="toast-timeout">
          <input id="toast-timeout" v-model.number="form.toastTimeoutSeconds" type="number" min="2" max="30" step="1" inputmode="numeric" required>
          <span>seconds</span>
        </label>
      </div>

      <div class="push-settings">
        <div class="push-settings__copy">
          <i class="bi bi-phone-vibrate" aria-hidden="true"></i>
          <div>
            <strong>Phone lock-screen notifications</strong>
            <p v-if="!pushState.supported">This browser does not support web push. On iPhone, add Pine Needle to the Home Screen and open it there.</p>
            <p v-else-if="pushState.permission === 'denied'">Notifications are blocked in this device's browser settings.</p>
            <p v-else-if="pushState.subscribed">Enabled on this device for new orders and paid booking deposits.</p>
            <p v-else>Enable alerts on this device, even when Pine Needle is closed.</p>
          </div>
        </div>
        <div class="push-settings__actions">
          <button v-if="pushState.subscribed" type="button" class="btn-outline" :disabled="pushBusy" @click="testPush">Send Test</button>
          <button type="button" class="btn-primary" :disabled="pushBusy || !pushState.supported || pushState.permission === 'denied'" @click="togglePush">
            {{ pushBusy ? 'Working...' : pushState.subscribed ? 'Turn Off' : 'Enable Alerts' }}
          </button>
        </div>
      </div>

      <label class="toggle-row appearance-toggle">
        <span>
          <strong>Liquid-glass footer</strong>
          <small>Use the translucent icy-green effect on the mobile dashboard navigation.</small>
        </span>
        <input v-model="form.liquidGlassEnabled" class="toggle-input" type="checkbox" role="switch">
      </label>

      <div v-if="form.liquidGlassEnabled" class="glass-intensity-setting">
        <div class="glass-intensity-heading">
          <label for="glass-intensity">Liquid-glass intensity</label>
          <output for="glass-intensity">{{ form.liquidGlassIntensity }}%</output>
        </div>
        <input id="glass-intensity" v-model.number="form.liquidGlassIntensity" type="range" min="0" max="100" step="1">
        <div class="glass-intensity-labels" aria-hidden="true"><span>Subtle</span><span>Strong</span></div>
      </div>

      <label v-if="form.liquidGlassEnabled" class="toggle-row appearance-toggle footer-depth-toggle">
        <span>
          <strong>3D footer buttons</strong>
          <small>Give each dashboard navigation button raised glass depth. Turn off for flat buttons.</small>
        </span>
        <input v-model="form.footerButtonDepthEnabled" class="toggle-input" type="checkbox" role="switch">
      </label>

      <label class="toggle-row appearance-toggle">
        <span>
          <strong>Dark photo editor</strong>
          <small>Use the original charcoal appearance when cropping and rotating photos.</small>
        </span>
        <input v-model="form.darkPhotoEditorEnabled" class="toggle-input" type="checkbox" role="switch">
      </label>

      <div class="settings-actions">
        <p><i class="bi bi-info-circle" aria-hidden="true"></i>Changes apply to new checkouts.</p>
        <button type="button" class="btn-primary save-button" :disabled="saving" @click="saveSettings">
          <i :class="saving ? 'bi bi-arrow-repeat' : 'bi bi-check2'" aria-hidden="true"></i>
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings-page { width: min(100%, 820px); margin: 0 auto; }
.settings-heading { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.settings-heading__icon { display: grid; width: 54px; height: 54px; flex: 0 0 54px; place-items: center; border-radius: 16px; background: var(--dashboard-green-bg); color: #187636; font-size: 1.4rem; }
.settings-heading h1 { margin: 0; color: #18231b; font-size: clamp(1.8rem, 4vw, 2.4rem); line-height: 1.1; }
.settings-heading p { margin: 6px 0 0; color: #607066; font-size: .98rem; }
.settings-card { overflow: hidden; border: 1px solid #dce5df; border-radius: 20px; background: #fff; box-shadow: 0 12px 35px rgba(28, 67, 39, .08); }
.section-heading { display: flex; align-items: center; justify-content: space-between; padding: 24px 26px 20px; border-bottom: 1px solid #e8eeea; }
.section-heading h2 { margin: 3px 0 0; color: #18231b; font-size: 1.45rem; }
.section-heading > i { color: #279749; font-size: 1.6rem; }
.eyebrow { color: #278443; font-size: .75rem; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
.toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 24px 26px; padding: 18px; border: 1px solid #dfe8e2; border-radius: 14px; background: #f8fbf9; cursor: pointer; }
.toggle-row > span:first-child { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.toggle-row strong { color: #203326; font-size: 1rem; }
.toggle-row small { color: #65746a; font-size: .88rem; line-height: 1.45; }
.toggle-input { width: 48px; height: 28px; flex: 0 0 48px; margin: 0; appearance: none; border: 0; border-radius: 999px; background: #b9c4bc; cursor: pointer; transition: background .18s ease; }
.toggle-input::before { display: block; width: 22px; height: 22px; margin: 3px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, .25); content: ''; transition: transform .18s ease; }
.toggle-input:checked { background: var(--dashboard-green); }
.toggle-input:checked::before { transform: translateX(20px); }
.toggle-input:focus-visible { outline: 3px solid rgba(46, 164, 79, .25); outline-offset: 3px; }
.settings-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding: 0 26px 26px; }
.setting-field { min-width: 0; padding: 20px; border: 1px solid #e2e9e4; border-radius: 14px; }
.setting-field > label { display: block; margin-bottom: 10px; color: #273b2d; font-size: .92rem; font-weight: 750; }
.setting-field > p { margin: 10px 0 0; color: #6a776e; font-size: .82rem; line-height: 1.45; }
.money-input { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; overflow: hidden; border: 1px solid #cbd7ce; border-radius: 10px; background: #fff; transition: border-color .18s ease, box-shadow .18s ease; }
.money-input:focus-within { border-color: var(--dashboard-green); box-shadow: 0 0 0 3px rgba(46, 164, 79, .14); }
.money-input > span { padding: 0 12px; color: #68766c; font-size: .84rem; font-weight: 700; }
.money-input input { width: 100%; min-width: 0; height: 48px; box-sizing: border-box; border: 0; border-radius: 0; outline: 0; background: transparent; color: #17251b; font: inherit; font-weight: 700; }
.settings-actions { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 26px; border-top: 1px solid #e8eeea; background: #fbfcfb; }
.notification-settings { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 0 26px 26px; padding: 18px 20px; border: 1px solid #e2e9e4; border-radius: 14px; }
.notification-settings__heading { display: flex; align-items: center; gap: 12px; }
.notification-settings__heading > i { color: var(--dashboard-green); font-size: 1.25rem; }
.notification-settings strong { color: #273b2d; font-size: .92rem; }
.notification-settings p { margin: 3px 0 0; color: #6a776e; font-size: .82rem; }
.notification-settings > label { display: flex; align-items: center; overflow: hidden; flex: 0 0 auto; border: 1px solid #cbd7ce; border-radius: 10px; }
.notification-settings input { width: 74px; height: 44px; box-sizing: border-box; border: 0; outline: 0; padding: 0 10px; font: inherit; font-weight: 700; }
.notification-settings label span { padding-right: 12px; color: #68766c; font-size: .82rem; font-weight: 700; }
.push-settings { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 0 26px 26px; padding: 18px 20px; border: 1px solid #cfe4d5; border-radius: 14px; background: #f5fbf7; }
.push-settings__copy { display: flex; align-items: center; gap: 12px; }
.push-settings__copy > i { color: var(--dashboard-green); font-size: 1.35rem; }
.push-settings strong { color: #273b2d; font-size: .92rem; }
.push-settings p { margin: 3px 0 0; color: #607066; font-size: .82rem; line-height: 1.4; }
.push-settings__actions { display: flex; flex: 0 0 auto; gap: 8px; }
.push-settings__actions button { min-height: 42px; white-space: nowrap; }
.appearance-toggle { margin-top: 0; }
.glass-intensity-setting { margin: -14px 26px 24px; padding: 16px 18px; border: 1px solid #dfe8e2; border-top: 0; border-radius: 0 0 14px 14px; background: #f8fbf9; }
.glass-intensity-heading, .glass-intensity-labels { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.glass-intensity-heading label { color: #203326; font-size: .92rem; font-weight: 750; }
.glass-intensity-heading output { color: var(--dashboard-green); font-weight: 800; }
.glass-intensity-setting input { width: 100%; margin: 14px 0 5px; accent-color: var(--dashboard-green); cursor: pointer; }
.glass-intensity-labels { color: #718078; font-size: .75rem; font-weight: 700; }
.footer-depth-toggle { margin-top: 0; }
.settings-actions p { display: flex; align-items: center; gap: 7px; margin: 0; color: #69766d; font-size: .84rem; }
.save-button { display: inline-flex; min-width: 170px; align-items: center; justify-content: center; gap: 8px; }

@media (max-width: 650px) {
  .settings-page { padding: 20px 16px 120px; }
  .settings-heading { align-items: flex-start; margin-bottom: 20px; }
  .settings-heading__icon { width: 46px; height: 46px; flex-basis: 46px; border-radius: 13px; }
  .settings-heading h1 { font-size: 1.75rem; }
  .settings-heading p { font-size: .9rem; }
  .settings-card { border-radius: 16px; }
  .section-heading { padding: 20px; }
  .toggle-row { align-items: flex-start; margin: 18px; padding: 16px; }
  .toggle-input { margin-top: 2px; }
  .glass-intensity-setting { margin: -10px 18px 18px; padding: 14px 16px; }
  .settings-fields { grid-template-columns: 1fr; gap: 12px; padding: 0 18px 18px; }
  .setting-field { padding: 16px; }
  .settings-actions { align-items: stretch; flex-direction: column-reverse; padding: 18px; }
  .notification-settings { align-items: flex-start; flex-direction: column; margin: 0 18px 18px; padding: 16px; }
  .push-settings { align-items: stretch; flex-direction: column; margin: 0 18px 18px; padding: 16px; }
  .push-settings__actions button { flex: 1; }
  .save-button { width: 100%; min-height: 50px; }
  .settings-actions p { justify-content: center; }
}

@media (max-width: 400px) {
  .settings-page { padding-inline: 12px; }
  .settings-heading__icon { display: none; }
  .toggle-row { gap: 12px; }
  .toggle-row small { font-size: .8rem; }
}
</style>
