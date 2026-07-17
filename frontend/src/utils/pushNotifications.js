const base64UrlToUint8Array = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const bytes = atob(base64)
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0))
}

export const pushSupported = () => (
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
)

export const getPushState = async () => {
  if (!pushSupported()) return { supported: false, subscribed: false, permission: 'unsupported' }
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return { supported: true, subscribed: Boolean(subscription), permission: Notification.permission }
}

export const enablePushNotifications = async () => {
  const configResponse = await fetch('/api/push/config', { credentials: 'include' })
  const config = await configResponse.json()
  if (!configResponse.ok || !config.configured) {
    throw new Error(config.error || 'Phone notifications are not configured on the server yet.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not allowed on this device.')

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(config.publicKey),
    })
  }

  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || 'This phone could not be subscribed.')
  }
  return subscription
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

export const sendTestPushNotification = async () => {
  const response = await fetch('/api/push/test', { method: 'POST', credentials: 'include' })
  if (!response.ok) throw new Error('The test notification could not be sent.')
}
