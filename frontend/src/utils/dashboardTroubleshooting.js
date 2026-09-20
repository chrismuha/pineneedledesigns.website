const LOGIN_RESET_ENABLED_KEY = 'pine-needle-login-reset-enabled'

export const getDashboardLoginResetEnabled = () => (
  window.localStorage.getItem(LOGIN_RESET_ENABLED_KEY) === 'true'
)

export const setDashboardLoginResetEnabled = (enabled) => {
  window.localStorage.setItem(LOGIN_RESET_ENABLED_KEY, enabled ? 'true' : 'false')
}
