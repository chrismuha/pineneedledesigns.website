import { createApp } from 'vue'
import { installCsrfFetch } from './api/csrf.js'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useCatalogStore } from './stores/catalog.js'
import { isInstalledPwa } from './utils/pwaDisplayMode.js'
import { applyStoredDashboardStatusBarColor } from './utils/dashboardAppearance.js'

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

const bootstrap = async () => {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const catalogStore = useCatalogStore()
  await catalogStore.initialize()

  app.use(router)
  app.mount('#app')
}

installCsrfFetch()
applyStoredDashboardStatusBarColor()
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const installedPwa = isInstalledPwa()
    let refreshing = false
    let hasActiveController = Boolean(navigator.serviceWorker.controller)
    let updatePromptShown = false
    let updatePromptTimer = null
    let updateNotificationDelayMinutes = 0
    const updateFoundAtKey = 'pine-needle-update-found-at'

    const setUpdateAvailable = (registration, available) => {
      const worker = registration.active || navigator.serviceWorker.controller
      worker?.postMessage({ type: available ? 'SET_UPDATE_AVAILABLE' : 'CLEAR_UPDATE_AVAILABLE' })
    }

    const markNotificationsSeen = (registration) => {
      if (!installedPwa) return
      const worker = navigator.serviceWorker.controller || registration.active
      worker?.postMessage({ type: 'APP_OPENED' })
    }

    const promptForUpdate = (registration, { immediate = false } = {}) => {
      if (!registration.waiting || updatePromptShown) return

      // Regular website visits update immediately: activate the new worker
      // immediately. Only the installed app asks before replacing its version.
      if (!installedPwa) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        return
      }

      if (!immediate && updateNotificationDelayMinutes > 0) {
        let updateFoundAt = Number(window.localStorage.getItem(updateFoundAtKey))
        if (!Number.isFinite(updateFoundAt) || updateFoundAt <= 0) {
          updateFoundAt = Date.now()
          window.localStorage.setItem(updateFoundAtKey, String(updateFoundAt))
        }
        const remaining = (updateNotificationDelayMinutes * 60 * 1000) - (Date.now() - updateFoundAt)
        if (remaining > 0) {
          window.clearTimeout(updatePromptTimer)
          updatePromptTimer = window.setTimeout(() => {
            updatePromptTimer = null
            promptForUpdate(registration, { immediate: true })
          }, remaining)
          return
        }
      }

      setUpdateAvailable(registration, true)
      updatePromptShown = true

      const dialog = document.createElement('dialog')
      dialog.setAttribute('aria-labelledby', 'pwa-update-title')
      dialog.innerHTML = `
        <form method="dialog" style="font-family:Poppins,system-ui,sans-serif;max-width:360px;padding:24px;margin:0">
          <h2 id="pwa-update-title" style="margin:0 0 10px;color:#1f7a3d;font-size:1.35rem">App update available</h2>
          <p style="margin:0 0 22px;color:#4f5f54;line-height:1.5">A new version of Pine Needle Designs is ready. Update now?</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <button value="later" style="min-height:48px;border:1px solid #b9c9bd;border-radius:10px;background:#fff;color:#294530;font:inherit;font-weight:700">Later</button>
            <button value="update" style="min-height:48px;border:0;border-radius:10px;background:#2ea44f;color:#fff;font:inherit;font-weight:700">Update now</button>
          </div>
        </form>`
      Object.assign(dialog.style, {
        border: '1px solid #d8eadb',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(17, 55, 30, .22)',
        maxWidth: 'calc(100vw - 32px)',
        padding: '0',
      })
      dialog.addEventListener('close', () => {
        if (dialog.returnValue === 'update') {
          setUpdateAvailable(registration, false)
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
        }
        dialog.remove()
      }, { once: true })
      document.body.append(dialog)
      dialog.showModal()
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.localStorage.removeItem(updateFoundAtKey)
      window.clearTimeout(updatePromptTimer)
      // Claiming the very first visit should not cause an unnecessary reload.
      if (!hasActiveController) {
        hasActiveController = true
        return
      }
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })

    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(async (registration) => {
        const checkForUpdate = () => registration.update().catch(() => {})

        if (installedPwa) {
          try {
            const response = await fetch('/api/settings')
            if (response.ok) {
              const settings = await response.json()
              updateNotificationDelayMinutes = Number(settings.updateNotificationDelayMinutes) || 0
            }
          } catch {}
        }

        markNotificationsSeen(registration)

        const handleManualUpdateCheck = async (event) => {
          let result = 'current'
          try {
            await registration.update()
            if (registration.installing) {
              await new Promise((resolve) => {
                registration.installing.addEventListener('statechange', ({ target }) => {
                  if (target.state === 'installed' || target.state === 'redundant') resolve()
                })
              })
            }
            if (registration.waiting) {
              result = 'available'
              updatePromptShown = false
              promptForUpdate(registration, { immediate: true })
            }
          } catch {
            result = 'error'
          }
          event.detail?.complete?.(result)
        }

        if (installedPwa) {
          window.addEventListener('pwa-manual-update-check', handleManualUpdateCheck)
          window.addEventListener('pwa-update-delay-change', (event) => {
            updateNotificationDelayMinutes = Number(event.detail?.minutes) || 0
            window.clearTimeout(updatePromptTimer)
            updatePromptTimer = null
            if (registration.waiting) promptForUpdate(registration)
          })
        }

        promptForUpdate(registration)
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          installingWorker?.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              promptForUpdate(registration)
            }
          })
        })

        // Check when the app is reopened and while a long-running installed PWA
        // remains active. The user decides when a waiting update is activated.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            markNotificationsSeen(registration)
            checkForUpdate()
          }
        })
        window.addEventListener('online', checkForUpdate)
        window.setInterval(checkForUpdate, 60 * 60 * 1000)
        checkForUpdate()
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error)
      })
  })
}
bootstrap()
