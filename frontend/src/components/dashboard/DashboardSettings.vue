<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { dashboardApi } from '../../api/dashboard.js'
import {
  clearDashboardAppearancePreviews,
  getDashboardDarkPhotoEditorEnabled,
  getDashboardFooterButtonDepthEnabled,
  getDashboardLiquidGlassEnabled,
  getDashboardLiquidGlassIntensity,
  getDashboardStatusBarColorEnabled,
  previewDashboardDarkPhotoEditor,
  previewDashboardFooterButtonDepth,
  previewDashboardLiquidGlass,
  previewDashboardLiquidGlassIntensity,
  previewDashboardStatusBarColor,
  setDashboardDarkPhotoEditorEnabled,
  setDashboardFooterButtonDepthEnabled,
  setDashboardLiquidGlassEnabled,
  setDashboardLiquidGlassIntensity,
  setDashboardStatusBarColorEnabled,
} from '../../utils/dashboardAppearance.js'
import { setDashboardToastTimeout, showDashboardToast } from '../../utils/dashboardToast.js'
import { isInstalledPwa } from '../../utils/pwaDisplayMode.js'
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushAlertPreferences,
  getPushState,
  getTestPushDelaySeconds,
  sendTestPushNotification,
  setPushAlertPreferences,
  setTestPushDelaySeconds,
} from '../../utils/pushNotifications.js'

const loading = ref(true)
const saving = ref(false)
const pushBusy = ref(false)
const updateChecking = ref(false)
const installedPwa = isInstalledPwa()
const updateAvailable = ref(installedPwa && window.localStorage.getItem('pine-needle-update-ready') === 'true')
const pushState = ref({ supported: true, subscribed: false, permission: 'default' })
const alertPreferences = ref(getPushAlertPreferences())
let confirmedAlertPreferences = { ...alertPreferences.value }
let alertPreferenceRevision = 0
let alertPreferenceSaveQueue = Promise.resolve()
const testPushDelaySeconds = ref(getTestPushDelaySeconds())
const error = ref('')
const form = ref({
  freeShippingEnabled: true,
  freeShippingMinimum: 28,
  fallbackShippingCost: 5,
  toastTimeoutSeconds: 6,
  updateNotificationDelayMinutes: 0,
  liquidGlassEnabled: getDashboardLiquidGlassEnabled(),
  liquidGlassIntensity: getDashboardLiquidGlassIntensity(),
  darkPhotoEditorEnabled: getDashboardDarkPhotoEditorEnabled(),
  footerButtonDepthEnabled: getDashboardFooterButtonDepthEnabled(),
  statusBarColorEnabled: getDashboardStatusBarColorEnabled(),
})
const savedSettings = ref('')
const settingsSnapshot = (settings) => JSON.stringify({
  freeShippingEnabled: Boolean(settings.freeShippingEnabled),
  freeShippingMinimum: Number(settings.freeShippingMinimum),
  fallbackShippingCost: Number(settings.fallbackShippingCost),
  toastTimeoutSeconds: Number(settings.toastTimeoutSeconds),
  updateNotificationDelayMinutes: Number(settings.updateNotificationDelayMinutes),
  liquidGlassEnabled: Boolean(settings.liquidGlassEnabled),
  liquidGlassIntensity: Number(settings.liquidGlassIntensity),
  darkPhotoEditorEnabled: Boolean(settings.darkPhotoEditorEnabled),
  footerButtonDepthEnabled: Boolean(settings.footerButtonDepthEnabled),
  statusBarColorEnabled: Boolean(settings.statusBarColorEnabled),
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

const saveAlertPreferences = () => {
  const revision = ++alertPreferenceRevision
  const preferences = { ...alertPreferences.value }
  alertPreferenceSaveQueue = alertPreferenceSaveQueue.then(async () => {
    try {
      const saved = await setPushAlertPreferences(preferences)
      confirmedAlertPreferences = { ...saved }
    } catch (err) {
      if (revision === alertPreferenceRevision) {
        alertPreferences.value = { ...confirmedAlertPreferences }
        showDashboardToast(err.message, { title: 'Preferences not saved' })
      }
    }
  })
}

const testPush = async () => {
  pushBusy.value = true
  try {
    const delay = setTestPushDelaySeconds(testPushDelaySeconds.value)
    testPushDelaySeconds.value = delay
    showDashboardToast(
      delay ? `Test scheduled for ${delay} seconds. Close the app now.` : 'Test is being sent now.',
      { type: 'success' },
    )
    await sendTestPushNotification(delay)
  } catch (err) {
    showDashboardToast(err.message, { title: 'Test failed' })
  } finally {
    pushBusy.value = false
  }
}

const checkForAppUpdate = () => {
  if (!('serviceWorker' in navigator)) {
    showDashboardToast('App updates are not supported on this device.', { title: 'Unable to check' })
    return
  }

  updateChecking.value = true
  window.dispatchEvent(new CustomEvent('pwa-manual-update-check', {
    detail: {
      complete: (result) => {
        updateChecking.value = false
        if (result === 'current') {
          showDashboardToast('Pine Needle Designs is up to date.', {
            type: 'success',
            title: 'No updates available',
          })
        } else if (result === 'error') {
          showDashboardToast('Could not check for updates. Check your connection and try again.', {
            title: 'Update check failed',
          })
        }
      },
    },
  }))
}

const installAppUpdate = () => {
  updateChecking.value = true
  window.dispatchEvent(new CustomEvent('pwa-install-waiting-update', {
    detail: {
      complete: (started) => {
        if (!started) {
          updateChecking.value = false
          updateAvailable.value = false
          showDashboardToast('The saved update is no longer available. Check again for the latest version.', {
            type: 'warning',
            title: 'Update unavailable',
          })
        }
      },
    },
  }))
}

const handleUpdateAvailabilityChange = (event) => {
  updateAvailable.value = event.detail?.available === true
  if (!updateAvailable.value) updateChecking.value = false
}

watch(() => form.value.liquidGlassEnabled, previewDashboardLiquidGlass)
watch(() => form.value.liquidGlassIntensity, previewDashboardLiquidGlassIntensity)
watch(() => form.value.darkPhotoEditorEnabled, previewDashboardDarkPhotoEditor)
watch(() => form.value.footerButtonDepthEnabled, previewDashboardFooterButtonDepth)
watch(() => form.value.statusBarColorEnabled, previewDashboardStatusBarColor)

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
      updateNotificationDelayMinutes: settings.updateNotificationDelayMinutes ?? 0,
      liquidGlassEnabled: getDashboardLiquidGlassEnabled(),
      liquidGlassIntensity: getDashboardLiquidGlassIntensity(),
      darkPhotoEditorEnabled: getDashboardDarkPhotoEditorEnabled(),
      footerButtonDepthEnabled: getDashboardFooterButtonDepthEnabled(),
      statusBarColorEnabled: getDashboardStatusBarColorEnabled(),
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
    form.value.updateNotificationDelayMinutes = settings.updateNotificationDelayMinutes ?? 0
    window.dispatchEvent(new CustomEvent('pwa-update-delay-change', {
      detail: { minutes: form.value.updateNotificationDelayMinutes },
    }))
    setDashboardToastTimeout(form.value.toastTimeoutSeconds)
    setDashboardLiquidGlassEnabled(form.value.liquidGlassEnabled)
    setDashboardLiquidGlassIntensity(form.value.liquidGlassIntensity)
    setDashboardDarkPhotoEditorEnabled(form.value.darkPhotoEditorEnabled)
    setDashboardFooterButtonDepthEnabled(form.value.footerButtonDepthEnabled)
    setDashboardStatusBarColorEnabled(form.value.statusBarColorEnabled)
    savedSettings.value = settingsSnapshot(form.value)
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
  if (installedPwa) {
    refreshPushState()
    window.addEventListener('pwa-update-availability-change', handleUpdateAvailabilityChange)
  }
})
onBeforeUnmount(() => {
  clearDashboardAppearancePreviews()
  window.removeEventListener('pwa-update-availability-change', handleUpdateAvailabilityChange)
})
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

      <div v-if="installedPwa" class="push-settings">
        <div class="push-settings__copy">
          <i class="bi bi-phone-vibrate" aria-hidden="true"></i>
          <div>
            <strong>Phone lock-screen notifications</strong>
            <p v-if="!pushState.supported">This device does not support app notifications. On iPhone, add Pine Needle to the Home Screen and open it there.</p>
            <p v-else-if="pushState.permission === 'denied'">Notifications are blocked in this device's settings.</p>
            <p v-else-if="pushState.subscribed">Enabled with sound for new orders and paid booking deposits.</p>
            <p v-else>Enable alerts on this device, even when Pine Needle is closed.</p>
            <p v-if="pushState.subscribed" class="push-settings__sound-help">
              On iPhone, sound is controlled in Settings → Notifications → Pine Needle Designs → Sounds. iOS web apps use Apple's notification sound and cannot install a custom tone.
            </p>
          </div>
        </div>
        <div class="push-settings__actions">
          <label v-if="pushState.subscribed" for="test-push-delay" class="test-push-delay">
            <span>Test delay</span>
            <input id="test-push-delay" v-model.number="testPushDelaySeconds" type="number" min="0" max="300" step="1" inputmode="numeric" :disabled="pushBusy" @change="testPushDelaySeconds = setTestPushDelaySeconds(testPushDelaySeconds)">
            <span>sec</span>
          </label>
          <button v-if="pushState.subscribed" type="button" class="btn-outline" :disabled="pushBusy" @click="testPush">Send Test</button>
          <button type="button" class="btn-primary" :disabled="pushBusy || !pushState.supported || pushState.permission === 'denied'" @click="togglePush">
            {{ pushBusy ? 'Working...' : pushState.subscribed ? 'Turn Off' : 'Enable Alerts' }}
          </button>
        </div>
      </div>

      <fieldset v-if="installedPwa && pushState.subscribed" class="alert-type-settings">
        <legend>Alert types on this device</legend>
        <label>
          <span><strong>Order alerts</strong><small>Notify me when a new paid order is received.</small></span>
          <input v-model="alertPreferences.orders" class="toggle-input" type="checkbox" role="switch" @change="saveAlertPreferences">
        </label>
        <label>
          <span><strong>Booking alerts</strong><small>Notify me when a fitting or bridal deposit is paid.</small></span>
          <input v-model="alertPreferences.bookings" class="toggle-input" type="checkbox" role="switch" @change="saveAlertPreferences">
        </label>
        <label>
          <span><strong>App-update alerts</strong><small>Show automatic update prompts, banners, and badges.</small></span>
          <input v-model="alertPreferences.updates" class="toggle-input" type="checkbox" role="switch" @change="saveAlertPreferences">
        </label>
      </fieldset>

      <div v-if="installedPwa" class="app-update-setting">
        <div class="app-update-setting__copy">
          <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
          <div>
            <strong>{{ updateAvailable ? 'App update available' : 'App updates' }}</strong>
            <p v-if="updateAvailable">A newer version is ready to install. This is not another update check.</p>
            <p v-else>Check whether a newer version of Pine Needle Designs is available.</p>
          </div>
        </div>
        <button
          type="button"
          :class="updateAvailable ? 'btn-primary' : 'btn-outline'"
          :disabled="updateChecking"
          @click="updateAvailable ? installAppUpdate() : checkForAppUpdate()"
        >
          {{ updateChecking ? (updateAvailable ? 'Installing Update...' : 'Checking...') : (updateAvailable ? 'Install Update Now' : 'Check for Updates') }}
        </button>
      </div>

      <div v-if="installedPwa" class="notification-settings update-delay-setting">
        <div class="notification-settings__heading">
          <i class="bi bi-clock-history" aria-hidden="true"></i>
          <div>
            <strong>App update notification delay</strong>
            <p>Choose how soon the update prompt, notification, and badge appear after an update is found.</p>
          </div>
        </div>
        <label for="update-notification-delay">
          <select id="update-notification-delay" v-model.number="form.updateNotificationDelayMinutes">
            <option :value="0">Instant</option>
            <option :value="5">5 minutes</option>
            <option :value="15">15 minutes</option>
            <option :value="30">30 minutes</option>
            <option :value="60">1 hour</option>
            <option :value="240">4 hours</option>
            <option :value="1440">1 day</option>
          </select>
        </label>
      </div>

      <label v-if="installedPwa" class="toggle-row appearance-toggle">
        <span>
          <strong>Green iPhone status area</strong>
          <small>Turn off the green background. iPhone keeps its own status-area effect, and page headers remain below it.</small>
        </span>
        <input v-model="form.statusBarColorEnabled" class="toggle-input" type="checkbox" role="switch">
      </label>

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
.settings-heading__icon { display: grid; width: 54px; height: 54px; flex: 0 0 54px; place-items: center; border-radius: 16px; background: var(--dashboard-primary-action-soft-surface); color: var(--dashboard-settings-settings-heading-icon-text); font-size: 16.8pt; }
.settings-heading h1 { margin: 0; color: var(--dashboard-settings-settings-heading-h1-text); font-size: 24pt; font-weight: 600; line-height: 1.1; }
.settings-heading p { margin: 6px 0 0; color: var(--dashboard-settings-settings-heading-p-text); font-size: 11.76pt; }
.settings-card { overflow: hidden; border: 1px solid var(--dashboard-settings-settings-card-border); border-radius: 20px; background: var(--dashboard-settings-settings-card-surface); box-shadow: 0 12px 35px var(--dashboard-settings-settings-card-shadow); }
.section-heading { display: flex; align-items: center; justify-content: space-between; padding: 24px 26px 20px; border-bottom: 1px solid var(--dashboard-settings-section-heading-border); }
.section-heading h2 { margin: 3px 0 0; color: var(--dashboard-settings-section-heading-h2-text); font-size: 17.4pt; }
.section-heading > i { color: var(--dashboard-settings-section-heading-i-text); font-size: 19.2pt; }
.eyebrow { color: var(--dashboard-settings-eyebrow-text); font-size: 9pt; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
.toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 24px 26px; padding: 18px; border: 1px solid var(--dashboard-settings-toggle-row-border); border-radius: 14px; background: var(--dashboard-settings-toggle-row-surface); cursor: pointer; }
.toggle-row > span:first-child { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.toggle-row strong { color: var(--dashboard-settings-toggle-row-strong-text); font-size: 12pt; }
.toggle-row small { color: var(--dashboard-settings-toggle-row-small-text); font-size: 10.56pt; line-height: 1.45; }
.toggle-input { width: 48px; height: 28px; flex: 0 0 48px; margin: 0; appearance: none; border: 0; border-radius: 999px; background: var(--dashboard-settings-toggle-input-surface); cursor: pointer; transition: background .18s ease; }
.toggle-input::before { display: block; width: 22px; height: 22px; margin: 3px; border-radius: 50%; background: var(--dashboard-settings-toggle-input-surface-2); box-shadow: 0 1px 4px var(--dashboard-settings-toggle-input-shadow); content: ''; transition: transform .18s ease; }
.toggle-input:checked { background: var(--dashboard-primary-action-color); }
.toggle-input:checked::before { transform: translateX(20px); }
.toggle-input:focus-visible { outline: 3px solid var(--dashboard-settings-toggle-input-focus-ring); outline-offset: 3px; }
.settings-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding: 0 26px 26px; }
.setting-field { min-width: 0; padding: 20px; border: 1px solid var(--dashboard-settings-setting-field-border); border-radius: 14px; }
.setting-field > label { display: block; margin-bottom: 10px; color: var(--dashboard-settings-setting-field-label-text); font-size: 11.04pt; font-weight: 750; }
.setting-field > p { margin: 10px 0 0; color: var(--dashboard-settings-setting-field-p-text); font-size: 9.84pt; line-height: 1.45; }
.money-input { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; overflow: hidden; border: 1px solid var(--dashboard-settings-money-input-border); border-radius: 10px; background: var(--dashboard-settings-money-input-surface); transition: border-color .18s ease, box-shadow .18s ease; }
.money-input:focus-within { border-color: var(--dashboard-primary-action-color); box-shadow: 0 0 0 3px var(--dashboard-settings-money-input-shadow); }
.money-input > span { padding: 0 12px; color: var(--dashboard-settings-money-input-span-text); font-size: 10.08pt; font-weight: 700; }
.money-input input { width: 100%; min-width: 0; height: 48px; box-sizing: border-box; border: 0; border-radius: 0; outline: 0; background: transparent; color: var(--dashboard-settings-money-input-input-text); font: inherit; font-weight: 700; }
.settings-actions { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 26px; border-top: 1px solid var(--dashboard-settings-settings-actions-border); background: var(--dashboard-settings-settings-actions-surface); }
.notification-settings { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 0 26px 26px; padding: 18px 20px; border: 1px solid var(--dashboard-settings-notification-settings-border); border-radius: 14px; }
.notification-settings__heading { display: flex; align-items: center; gap: 12px; }
.notification-settings__heading > i { color: var(--dashboard-primary-action-color); font-size: 15pt; }
.notification-settings strong { color: var(--dashboard-settings-notification-settings-strong-text); font-size: 11.04pt; }
.notification-settings p { margin: 3px 0 0; color: var(--dashboard-settings-notification-settings-p-text); font-size: 9.84pt; }
.notification-settings > label { display: flex; align-items: center; overflow: hidden; flex: 0 0 auto; border: 1px solid var(--dashboard-settings-notification-settings-label-border); border-radius: 10px; }
.notification-settings input { width: 74px; height: 44px; box-sizing: border-box; border: 0; outline: 0; padding: 0 10px; font: inherit; font-weight: 700; }
.notification-settings select { min-width: 126px; height: 44px; box-sizing: border-box; border: 0; outline: 0; padding: 0 10px; background: var(--dashboard-settings-notification-settings-select-surface); color: var(--dashboard-settings-notification-settings-select-text); font: inherit; font-weight: 700; }
.notification-settings label span { padding-right: 12px; color: var(--dashboard-settings-notification-settings-label-span-text); font-size: 9.84pt; font-weight: 700; }
.push-settings { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 0 26px 26px; padding: 18px 20px; border: 1px solid var(--dashboard-settings-push-settings-border); border-radius: 14px; background: var(--dashboard-settings-push-settings-surface); }
.push-settings__copy { display: flex; align-items: center; gap: 12px; }
.push-settings__copy > i { color: var(--dashboard-primary-action-color); font-size: 16.2pt; }
.push-settings strong { color: var(--dashboard-settings-push-settings-strong-text); font-size: 11.04pt; }
.push-settings p { margin: 3px 0 0; color: var(--dashboard-settings-push-settings-p-text); font-size: 9.84pt; line-height: 1.4; }
.push-settings .push-settings__sound-help { margin-top: 8px; color: var(--dashboard-settings-settings-push-settings-sound-help-text); }
.push-settings__actions { display: flex; flex: 0 0 auto; gap: 8px; }
.push-settings__actions button { min-height: 42px; white-space: nowrap; }
.test-push-delay { display: flex; align-items: center; gap: 6px; color: var(--dashboard-settings-push-settings-p-text); font-size: 9.6pt; white-space: nowrap; }
.test-push-delay input { width: 64px; min-height: 42px; padding: 6px 8px; }
.alert-type-settings { display: grid; gap: 0; margin: 0 26px 26px; padding: 0; overflow: hidden; border: 1px solid var(--dashboard-settings-alert-type-settings-border); border-radius: 14px; }
.alert-type-settings legend { width: 100%; margin: 0; padding: 14px 18px; border-bottom: 1px solid var(--dashboard-settings-alert-type-settings-legend-border); background: var(--dashboard-settings-alert-type-settings-legend-surface); color: var(--dashboard-settings-alert-type-settings-legend-text); font-size: 10.8pt; font-weight: 800; }
.alert-type-settings > label { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 15px 18px; cursor: pointer; }
.alert-type-settings > label + label { border-top: 1px solid var(--dashboard-settings-alert-type-settings-label-label-border); }
.alert-type-settings label > span { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.alert-type-settings strong { color: var(--dashboard-settings-alert-type-settings-strong-text); font-size: 10.8pt; }
.alert-type-settings small { color: var(--dashboard-settings-alert-type-settings-small-text); font-size: 9.6pt; line-height: 1.4; }
.app-update-setting { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 0 26px 26px; padding: 18px 20px; border: 1px solid var(--dashboard-settings-app-update-setting-border); border-radius: 14px; background: var(--dashboard-settings-app-update-setting-surface); }
.app-update-setting__copy { display: flex; align-items: center; gap: 12px; }
.app-update-setting__copy > i { color: var(--dashboard-primary-action-color); font-size: 16.2pt; }
.app-update-setting strong { color: var(--dashboard-settings-app-update-setting-strong-text); font-size: 11.04pt; }
.app-update-setting p { margin: 3px 0 0; color: var(--dashboard-settings-app-update-setting-p-text); font-size: 9.84pt; line-height: 1.4; }
.app-update-setting button { min-height: 42px; flex: 0 0 auto; white-space: nowrap; }
.appearance-toggle { margin-top: 0; }
.glass-intensity-setting { margin: -14px 26px 24px; padding: 16px 18px; border: 1px solid var(--dashboard-settings-glass-intensity-setting-border); border-top: 0; border-radius: 0 0 14px 14px; background: var(--dashboard-settings-glass-intensity-setting-surface); }
.glass-intensity-heading, .glass-intensity-labels { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.glass-intensity-heading label { color: var(--dashboard-settings-glass-intensity-heading-label-text); font-size: 11.04pt; font-weight: 750; }
.glass-intensity-heading output { color: var(--dashboard-primary-action-color); font-weight: 800; }
.glass-intensity-setting input { width: 100%; margin: 14px 0 5px; accent-color: var(--dashboard-primary-action-color); cursor: pointer; }
.glass-intensity-labels { color: var(--dashboard-settings-glass-intensity-labels-text); font-size: 9pt; font-weight: 700; }
.footer-depth-toggle { margin-top: 0; }
.settings-actions p { display: flex; align-items: center; gap: 7px; margin: 0; color: var(--dashboard-settings-settings-actions-p-text); font-size: 10.08pt; }
.save-button { display: inline-flex; min-width: 170px; align-items: center; justify-content: center; gap: 8px; }

@media (max-width: 650px) {
  .settings-page { padding: 20px 16px 120px; }
  .settings-heading { align-items: flex-start; margin-bottom: 20px; }
  .settings-heading__icon { width: 46px; height: 46px; flex-basis: 46px; border-radius: 13px; }
  .settings-heading h1 { font-size: 19.8pt; }
  .settings-heading p { font-size: 10.8pt; }
  .settings-card { border-radius: 16px; }
  .section-heading { padding: 20px; }
  .toggle-row { align-items: flex-start; margin: 18px; padding: 16px; }
  .alert-type-settings { margin: 0 18px 18px; }
  .toggle-input { margin-top: 2px; }
  .glass-intensity-setting { margin: -10px 18px 18px; padding: 14px 16px; }
  .settings-fields { grid-template-columns: 1fr; gap: 12px; padding: 0 18px 18px; }
  .setting-field { padding: 16px; }
  .settings-actions { align-items: stretch; flex-direction: column-reverse; padding: 18px; }
  .notification-settings { align-items: flex-start; flex-direction: column; margin: 0 18px 18px; padding: 16px; }
  .push-settings { align-items: stretch; flex-direction: column; margin: 0 18px 18px; padding: 16px; }
  .push-settings__actions { flex-wrap: wrap; }
  .test-push-delay { flex: 1 0 100%; }
  .push-settings__actions button { flex: 1; }
  .app-update-setting { align-items: stretch; flex-direction: column; margin: 0 18px 18px; padding: 16px; }
  .app-update-setting button { width: 100%; min-height: 48px; }
  .save-button { width: 100%; min-height: 50px; }
  .settings-actions p { justify-content: center; }
}

@media (max-width: 400px) {
  .settings-page { padding-inline: 12px; }
  .settings-heading__icon { display: none; }
  .toggle-row { gap: 12px; }
  .toggle-row small { font-size: 9.6pt; }
}
</style>
