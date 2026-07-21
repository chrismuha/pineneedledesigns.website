import { isInstalledPwa } from './pwaDisplayMode.js'

const PUSH_PREFERENCES_KEY = 'pine-needle-push-alert-preferences'
const TEST_PUSH_DELAY_KEY = 'pine-needle-test-push-delay-seconds'
const defaultPreferences = { orders: true, bookings: true, updates: true }

export const getTestPushDelaySeconds = () => {
  const saved = Number(window.localStorage.getItem(TEST_PUSH_DELAY_KEY))
  return Number.isFinite(saved) && saved >= 0 && saved <= 300 ? saved : 5
}

export const setTestPushDelaySeconds = (value) => {
  const normalized = Math.min(300, Math.max(0, Math.round(Number(value) || 0)))
  window.localStorage.setItem(TEST_PUSH_DELAY_KEY, String(normalized))
  return normalized
}

export const getPushAlertPreferences = () => {
  try {
    return { ...defaultPreferences, ...JSON.parse(window.localStorage.getItem(PUSH_PREFERENCES_KEY) || '{}') }
  } catch {
    return { ...defaultPreferences }
  }
}

const subscriptionPayload = (subscription, preferences = getPushAlertPreferences()) => ({
  ...subscription.toJSON(),
  preferences: {
    orders: preferences.orders !== false,
    bookings: preferences.bookings !== false,
  },
})

const syncSubscription = (subscription, preferences) => fetch('/api/push/subscribe', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(subscriptionPayload(subscription, preferences)),
})

const base64UrlToUint8Array = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const bytes = atob(base64)
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0))
}

const applicationServerKeyMatches = (subscription, publicKey) => {
  const currentKey = subscription?.options?.applicationServerKey
  if (!currentKey) return true
  const expectedKey = base64UrlToUint8Array(publicKey)
  const currentBytes = new Uint8Array(currentKey)
  return currentBytes.length === expectedKey.length
    && currentBytes.every((byte, index) => byte === expectedKey[index])
}

const getPushConfig = async () => {
  const response = await fetch('/api/push/config', { credentials: 'include' })
  const config = await response.json().catch(() => ({}))
  if (!response.ok || !config.configured) {
    throw new Error(config.error || 'Phone notifications are not configured on the server yet.')
  }
  return config
}

const ensureCurrentSubscription = async (registration, config) => {
  let subscription = await registration.pushManager.getSubscription()
  // A subscription is bound to the VAPID public key used to create it. Keeping
  // one after that key changes makes the push service reject background sends.
  if (subscription && !applicationServerKeyMatches(subscription, config.publicKey)) {
    await subscription.unsubscribe()
    subscription = null
  }
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(config.publicKey),
    })
  }
  return subscription
}

export const pushSupported = () => (
  isInstalledPwa()
  && 'serviceWorker' in navigator
  && 'PushManager' in window
  && 'Notification' in window
)

export const getPushState = async () => {
  if (!pushSupported()) return { supported: false, subscribed: false, permission: 'unsupported' }
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription && Notification.permission === 'granted') {
    // Refresh the server copy in case the database was restored or iOS rotated
    // the endpoint while the Home Screen app was not running.
    await syncSubscription(subscription).catch(() => {})
  }
  return {
    supported: true,
    subscribed: Boolean(subscription),
    permission: Notification.permission,
    preferences: getPushAlertPreferences(),
  }
}

export const refreshPushSubscription = async () => {
  if (!pushSupported() || Notification.permission !== 'granted') return null
  const registration = await navigator.serviceWorker.ready
  const config = await getPushConfig()
  const subscription = await ensureCurrentSubscription(registration, config)
  const response = await syncSubscription(subscription)
  if (!response.ok) throw new Error('This phone could not refresh its notification subscription.')
  return subscription
}

export const enablePushNotifications = async () => {
  const config = await getPushConfig()

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not allowed on this device.')

  const registration = await navigator.serviceWorker.ready
  const subscription = await ensureCurrentSubscription(registration, config)

  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscriptionPayload(subscription)),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'This phone could not be subscribed.')
  }
  return subscription
}

export const setPushAlertPreferences = async (preferences) => {
  const normalized = {
    orders: preferences.orders !== false,
    bookings: preferences.bookings !== false,
    updates: preferences.updates !== false,
  }
  if (pushSupported()) {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      const response = await syncSubscription(subscription, normalized)
      if (!response.ok) throw new Error('Notification preferences could not be saved on the server.')
    }
  }
  window.localStorage.setItem(PUSH_PREFERENCES_KEY, JSON.stringify(normalized))
  window.dispatchEvent(new CustomEvent('pwa-update-alert-preference-change', {
    detail: { enabled: normalized.updates },
  }))
  return normalized
}

export const disablePushNotifications = async () => {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })
  await subscription.unsubscribe()
}

export const sendTestPushNotification = async (delaySeconds = getTestPushDelaySeconds()) => {
  const response = await fetch('/api/push/test', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delaySeconds }),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'The test notification could not be sent.')
  }
}
