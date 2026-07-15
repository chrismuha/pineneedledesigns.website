const LIQUID_GLASS_KEY = 'dashboard-liquid-glass-enabled'

export const getDashboardLiquidGlassEnabled = () => {
  try {
    return window.localStorage.getItem(LIQUID_GLASS_KEY) !== 'false'
  } catch {
    return true
  }
}

export const setDashboardLiquidGlassEnabled = (enabled) => {
  const value = Boolean(enabled)

  try {
    window.localStorage.setItem(LIQUID_GLASS_KEY, String(value))
  } catch {}

  window.dispatchEvent(new CustomEvent('dashboard-liquid-glass-change', {
    detail: { enabled: value },
  }))
}
