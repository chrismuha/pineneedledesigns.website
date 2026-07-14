export const showDashboardToast = (message, options = {}) => {
  if (typeof window === 'undefined' || !message) return
  window.dispatchEvent(new CustomEvent('dashboard-toast', {
    detail: {
      message: String(message),
      title: options.title || '',
      type: options.type || 'error',
      duration: options.duration || 6500,
    },
  }))
}
