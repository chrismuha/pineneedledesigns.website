const LIQUID_GLASS_KEY = 'dashboard-liquid-glass-enabled'
const LIQUID_GLASS_INTENSITY_KEY = 'dashboard-liquid-glass-intensity'
const DARK_PHOTO_EDITOR_KEY = 'dashboard-dark-photo-editor-enabled'
let liquidGlassPreview
let liquidGlassIntensityPreview
let darkPhotoEditorPreview

const getStoredLiquidGlassEnabled = () => {
  try {
    return window.localStorage.getItem(LIQUID_GLASS_KEY) !== 'false'
  } catch {
    return true
  }
}

const normalizeIntensity = (value) => Math.min(100, Math.max(0, Number(value) || 0))

const getStoredLiquidGlassIntensity = () => {
  try {
    const value = window.localStorage.getItem(LIQUID_GLASS_INTENSITY_KEY)
    return value === null ? 50 : normalizeIntensity(value)
  } catch {
    return 50
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
    detail: { enabled, intensity: getDashboardLiquidGlassIntensity() },
  }))
}

export const getDashboardLiquidGlassEnabled = () => liquidGlassPreview ?? getStoredLiquidGlassEnabled()

export const previewDashboardLiquidGlass = (enabled) => {
  liquidGlassPreview = Boolean(enabled)
  announceLiquidGlass(liquidGlassPreview)
}

export const getDashboardLiquidGlassIntensity = () => liquidGlassIntensityPreview ?? getStoredLiquidGlassIntensity()

export const previewDashboardLiquidGlassIntensity = (intensity) => {
  liquidGlassIntensityPreview = normalizeIntensity(intensity)
  announceLiquidGlass(getDashboardLiquidGlassEnabled())
}

export const setDashboardLiquidGlassEnabled = (enabled) => {
  const value = Boolean(enabled)

  try {
    window.localStorage.setItem(LIQUID_GLASS_KEY, String(value))
  } catch {}

  liquidGlassPreview = undefined
  announceLiquidGlass(value)
}

export const setDashboardLiquidGlassIntensity = (intensity) => {
  const value = normalizeIntensity(intensity)
  try {
    window.localStorage.setItem(LIQUID_GLASS_INTENSITY_KEY, String(value))
  } catch {}
  liquidGlassIntensityPreview = undefined
  announceLiquidGlass(getDashboardLiquidGlassEnabled())
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
  liquidGlassIntensityPreview = undefined
  darkPhotoEditorPreview = undefined
  announceLiquidGlass(getStoredLiquidGlassEnabled())
}
