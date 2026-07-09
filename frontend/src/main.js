import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useCatalogStore } from './stores/catalog.js'

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

bootstrap()
