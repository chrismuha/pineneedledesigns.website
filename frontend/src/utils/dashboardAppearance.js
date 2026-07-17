const LIQUID_GLASS_KEY = 'dashboard-liquid-glass-enabled'
const LIQUID_GLASS_INTENSITY_KEY = 'dashboard-liquid-glass-intensity'
const FOOTER_BUTTON_DEPTH_KEY = 'dashboard-footer-button-depth-enabled'
const DARK_PHOTO_EDITOR_KEY = 'dashboard-dark-photo-editor-enabled'
const STATUS_BAR_COLOR_KEY = 'dashboard-status-bar-color-enabled'
let liquidGlassPreview
let liquidGlassIntensityPreview
let footerButtonDepthPreview
let darkPhotoEditorPreview
let statusBarColorPreview

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

const getStoredFooterButtonDepthEnabled = () => {
  try {
    return window.localStorage.getItem(FOOTER_BUTTON_DEPTH_KEY) !== 'false'
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

const getStoredStatusBarColorEnabled = () => {
  try {
    return window.localStorage.getItem(STATUS_BAR_COLOR_KEY) !== 'false'
  } catch {
    return true
  }
}

const announceStatusBarColor = (enabled) => {
  const colorEnabled = Boolean(enabled)
  document.documentElement.dataset.pwaStatusBarColor = colorEnabled ? 'green' : 'transparent'
  window.dispatchEvent(new CustomEvent('dashboard-status-bar-color-change', {
    detail: { enabled: colorEnabled },
  }))
}

const announceLiquidGlass = (enabled) => {
  window.dispatchEvent(new CustomEvent('dashboard-liquid-glass-change', {
    detail: {
      enabled,
      intensity: getDashboardLiquidGlassIntensity(),
      buttonDepthEnabled: getDashboardFooterButtonDepthEnabled(),
    },
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

export const getDashboardFooterButtonDepthEnabled = () => footerButtonDepthPreview ?? getStoredFooterButtonDepthEnabled()

export const previewDashboardFooterButtonDepth = (enabled) => {
  footerButtonDepthPreview = Boolean(enabled)
  announceLiquidGlass(getDashboardLiquidGlassEnabled())
}

export const setDashboardFooterButtonDepthEnabled = (enabled) => {
  const value = Boolean(enabled)
  try {
    window.localStorage.setItem(FOOTER_BUTTON_DEPTH_KEY, String(value))
  } catch {}
  footerButtonDepthPreview = undefined
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

export const getDashboardStatusBarColorEnabled = () => statusBarColorPreview ?? getStoredStatusBarColorEnabled()

export const previewDashboardStatusBarColor = (enabled) => {
  statusBarColorPreview = Boolean(enabled)
  announceStatusBarColor(statusBarColorPreview)
}

export const setDashboardStatusBarColorEnabled = (enabled) => {
  const value = Boolean(enabled)
  try {
    window.localStorage.setItem(STATUS_BAR_COLOR_KEY, String(value))
  } catch {}
  statusBarColorPreview = undefined
  announceStatusBarColor(value)
}

export const applyStoredDashboardStatusBarColor = () => {
  announceStatusBarColor(getStoredStatusBarColorEnabled())
}

export const clearDashboardAppearancePreviews = () => {
  liquidGlassPreview = undefined
  liquidGlassIntensityPreview = undefined
  footerButtonDepthPreview = undefined
  darkPhotoEditorPreview = undefined
  statusBarColorPreview = undefined
  announceLiquidGlass(getStoredLiquidGlassEnabled())
  announceStatusBarColor(getStoredStatusBarColorEnabled())
}
