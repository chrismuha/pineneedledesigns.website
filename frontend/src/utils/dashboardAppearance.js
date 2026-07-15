const LIQUID_GLASS_KEY = 'dashboard-liquid-glass-enabled'
const DARK_PHOTO_EDITOR_KEY = 'dashboard-dark-photo-editor-enabled'
let liquidGlassPreview
let darkPhotoEditorPreview

const getStoredLiquidGlassEnabled = () => {
  try {
    return window.localStorage.getItem(LIQUID_GLASS_KEY) !== 'false'
  } catch {
    return true
  }
}

const getStoredDarkPhotoEditorEnabled = () => {
  try {
    return window.localStorage.getItem(DARK_PHOTO_EDITOR_KEY) === 'true'
  } catch {
    return false
  }
}

const announceLiquidGlass = (enabled) => {
  window.dispatchEvent(new CustomEvent('dashboard-liquid-glass-change', {
    detail: { enabled },
  }))
}

export const getDashboardLiquidGlassEnabled = () => liquidGlassPreview ?? getStoredLiquidGlassEnabled()

export const previewDashboardLiquidGlass = (enabled) => {
  liquidGlassPreview = Boolean(enabled)
  announceLiquidGlass(liquidGlassPreview)
}

export const setDashboardLiquidGlassEnabled = (enabled) => {
  const value = Boolean(enabled)

  try {
    window.localStorage.setItem(LIQUID_GLASS_KEY, String(value))
  } catch {}

  liquidGlassPreview = undefined
  announceLiquidGlass(value)
}

export const getDashboardDarkPhotoEditorEnabled = () => darkPhotoEditorPreview ?? getStoredDarkPhotoEditorEnabled()

export const previewDashboardDarkPhotoEditor = (enabled) => {
  darkPhotoEditorPreview = Boolean(enabled)
}

export const setDashboardDarkPhotoEditorEnabled = (enabled) => {
  try {
    window.localStorage.setItem(DARK_PHOTO_EDITOR_KEY, String(Boolean(enabled)))
  } catch {}
  darkPhotoEditorPreview = undefined
}

export const clearDashboardAppearancePreviews = () => {
  liquidGlassPreview = undefined
  darkPhotoEditorPreview = undefined
  announceLiquidGlass(getStoredLiquidGlassEnabled())
}
