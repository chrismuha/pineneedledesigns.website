const storageKey = 'dashboard-toast-timeout-ms'
let toastTimeout = Number(globalThis.localStorage?.getItem(storageKey)) || 6000

export const setDashboardToastTimeout = (seconds) => {
  const normalizedSeconds = Math.min(30, Math.max(2, Number(seconds) || 6))
  toastTimeout = normalizedSeconds * 1000
  globalThis.localStorage?.setItem(storageKey, String(toastTimeout))
}

export const showDashboardToast = (message, options = {}) => {
  if (typeof window === 'undefined' || !message) return
  window.dispatchEvent(new CustomEvent('dashboard-toast', {
    detail: {
      message: String(message),
      title: options.title || '',
      type: options.type || 'error',
      duration: options.duration || toastTimeout,
    },
  }))
}
