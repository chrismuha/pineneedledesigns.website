const LIQUID_GLASS_KEY = 'dashboard-liquid-glass-enabled'
const DARK_PHOTO_EDITOR_KEY = 'dashboard-dark-photo-editor-enabled'

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

export const getDashboardDarkPhotoEditorEnabled = () => {
  try {
    return window.localStorage.getItem(DARK_PHOTO_EDITOR_KEY) === 'true'
  } catch {
    return false
  }
}

export const setDashboardDarkPhotoEditorEnabled = (enabled) => {
  try {
    window.localStorage.setItem(DARK_PHOTO_EDITOR_KEY, String(Boolean(enabled)))
  } catch {}
}
