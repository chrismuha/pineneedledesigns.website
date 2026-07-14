<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { dashboardApi } from '../api/dashboard.js'
import { setDashboardToastTimeout } from '../utils/dashboardToast.js'

const route = useRoute()
const router = useRouter()
const dragTarget = ref('')
const navDrag = ref(null)
const suppressSyntheticClick = ref(false)
const toasts = ref([])
let nextToastId = 0

const dismissToast = (id) => {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

const handleToast = (event) => {
  const id = ++nextToastId
  const toast = { id, ...event.detail }
  toasts.value.push(toast)
  window.setTimeout(() => dismissToast(id), toast.duration || 6500)
}

onMounted(async () => {
  window.addEventListener('dashboard-toast', handleToast)
  try {
    const settings = await dashboardApi.getSettings()
    setDashboardToastTimeout(settings.toastTimeoutSeconds ?? 6)
  } catch {}
})
onBeforeUnmount(() => window.removeEventListener('dashboard-toast', handleToast))

const tabAtPoint = (x, y) =>
  document.elementFromPoint(x, y)?.closest?.('[data-nav-path]')?.dataset.navPath || ''

const startNavDrag = (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  navDrag.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  }
  dragTarget.value = ''
}

const moveNavDrag = (event) => {
  const drag = navDrag.value
  if (!drag || drag.pointerId !== event.pointerId) return

  if (!drag.moved) {
    drag.moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 8
  }
  if (!drag.moved) return

  const target = tabAtPoint(event.clientX, event.clientY)
  if (target) dragTarget.value = target
}

const finishNavDrag = (event) => {
  const drag = navDrag.value
  if (!drag || drag.pointerId !== event.pointerId) return

  const target = drag.moved
    ? tabAtPoint(event.clientX, event.clientY) || dragTarget.value
    : ''

  navDrag.value = null
  dragTarget.value = ''

  if (!target) return

  suppressSyntheticClick.value = true
  window.setTimeout(() => {
    suppressSyntheticClick.value = false
  }, 0)
  void router.push(target)
}

const cancelNavDrag = () => {
  navDrag.value = null
  dragTarget.value = ''
}

const handleNavClick = (event) => {
  if (!suppressSyntheticClick.value) return

  event.preventDefault()
  event.stopPropagation()
  suppressSyntheticClick.value = false
}

const menuItems = [
  {
    label: 'Home',
    to: '/dashboard',
    icon: 'bi-house',
  },
  {
    label: 'Create',
    to: '/dashboard/create',
    icon: 'bi-plus-square',
  },
  {
    label: 'Items',
    to: '/dashboard/items',
    icon: 'bi-grid',
  },
  {
    label: 'Orders',
    to: '/dashboard/orders',
    icon: 'bi-receipt',
  },
  {
    label: 'Settings',
    to: '/dashboard/settings',
    icon: 'bi-gear',
  },
]

const isActive = (path) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard'
  }

  return route.path.startsWith(path)
}

const activeNavIndex = computed(() => {
  const activePath = dragTarget.value || menuItems.find((item) => isActive(item.to))?.to
  return Math.max(0, menuItems.findIndex((item) => item.to === activePath))
})

</script>

<template>
  <div class="dashboard-shell">
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="sidebar-content">

          <RouterLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="sidebar-btn"
            :class="{ active: isActive(item.to) }"
          >
            <i :class="['bi', item.icon, 'menu-icon']" aria-hidden="true"></i>
            <span class="label">{{ item.label }}</span>
          </RouterLink>

          <div class="sidebar-footer">
            <h2 class="external-site">
              <p>Pine Needle Designs</p>
              <a href="https://pineneedledesigns.store/" target="_block">
                <i class="bi bi-arrow-up-right-circle-fill"></i>
                <span class="info-box">External Site</span>
              </a>
            </h2>

          </div>
        </div>
      </aside>

      <main class="content">
        <RouterView />
      </main>
    </div>

    <!--
      Original GlobalFooter action bar moved here for reference. It stays
      commented out while the current liquid-glass dashboard nav is active.

      <div class="footer-actions" aria-label="Shop and booking links">
        <RouterLink to="/collections" aria-label="Shop all collections">
          <i class="bi bi-shop" aria-hidden="true"></i>
          <span>Shop</span>
        </RouterLink>
        <RouterLink to="/booking/fitting">
          <i class="footer-actions__emoji" aria-hidden="true">💃🏻</i>
          <span>First Fitting</span>
        </RouterLink>
        <RouterLink to="/booking/brides">
          <i class="footer-actions__emoji" aria-hidden="true">👰🏻‍♀️</i>
          <span>Brides</span>
        </RouterLink>
        <a href="https://calendar.app.google/CJqD3qRvcjUuq2HB7">
          <i class="footer-actions__emoji" aria-hidden="true">👚</i>
          <span>Repeat Customers</span>
        </a>
      </div>
    -->

    <!-- Mobile bottom nav for widths below 850px -->
    <nav
      class="bottom-nav"
      aria-label="Dashboard navigation"
      @pointerdown="startNavDrag"
      @pointermove="moveNavDrag"
      @pointerup="finishNavDrag"
      @pointercancel="cancelNavDrag"
      @click.capture="handleNavClick"
    >
      <span
        class="bottom-nav-lens"
        :class="`bottom-nav-lens--${activeNavIndex}`"
        aria-hidden="true"
      ></span>

      <RouterLink
        v-for="(item, index) in menuItems"
        :key="item.to"
        :to="item.to"
        :data-nav-path="item.to"
        class="bottom-tab"
        :class="{ active: dragTarget ? dragTarget === item.to : isActive(item.to), 'drag-preview': dragTarget === item.to }"
        :style="{ gridColumn: index + 1 }"
        @dragstart.prevent
      >
        <i :class="['bi', item.icon, 'menu-icon']" aria-hidden="true"></i>
        <span class="label">{{ item.label }}</span>
      </RouterLink>

    </nav>

    <div class="toast-region" aria-live="assertive" aria-atomic="false">
      <article v-for="toast in toasts" :key="toast.id" class="dashboard-toast" :class="`dashboard-toast--${toast.type}`">
        <i :class="toast.type === 'success' ? 'bi bi-check-circle-fill' : toast.type === 'warning' ? 'bi bi-exclamation-triangle-fill' : 'bi bi-x-circle-fill'" aria-hidden="true"></i>
        <div>
          <strong>{{ toast.title || (toast.type === 'success' ? 'Success' : toast.type === 'warning' ? 'Action needed' : 'Request failed') }}</strong>
          <p>{{ toast.message }}</p>
        </div>
        <button type="button" aria-label="Dismiss notification" @click="dismissToast(toast.id)">×</button>
      </article>
    </div>
  </div>
</template>

<style src="../styles/dashboard.css"></style>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100dvh;
}

.sidebar {
  width: 260px;
}

.sidebar-content {
  padding: 24px;
  height: 100vh;
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.external-site {
  margin-bottom: 20px;
  background: var(--dashboard-green);
  color: white;
  padding: 0.5rem;
  font-size: 1.3rem;
  border-radius: 0.5rem;
  position: relative;
  width: 100%;
  display: flex;
}
.external-site p {
  width: 90%;
  margin-bottom: 0;
}
.external-site a {
  position: absolute;
  right: 0.5rem;
}
.external-site a:hover .info-box {
  display: block;
}
.external-site .info-box {
  display: none;
  position: absolute;
  font-size: 0.8rem;
  width: 7rem;
  background: #003b06;
  padding: 0.2rem;
  text-align: center;
  border-radius: 0.2rem;
  top: -1.5rem;
  right: -3rem;
  opacity: 90%;
}


.sidebar-btn {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  gap: 8px;
  background: white;
}

.sidebar-btn i {
  font-size: 1.2rem;
  color: var(--dashboard-green);
}

.sidebar-btn.active {
  background: var(--dashboard-green);
  color: white;
}

.sidebar-btn.active i {
  color: white;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  /* border-top: 1px solid #e5e5e5; */
}


.content {
  flex: 1;
  padding: 24px;
}

.toast-region { position: fixed; z-index: 6000; top: 18px; right: 18px; display: grid; width: min(390px, calc(100vw - 32px)); gap: 10px; pointer-events: none; }
.dashboard-toast { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: 12px; padding: 15px 14px; border: 1px solid #f0b8c4; border-radius: 14px; background: #fff; color: #722039; box-shadow: 0 16px 40px rgba(64, 19, 30, .2); pointer-events: auto; animation: toast-in .2s ease-out; }
.dashboard-toast > i { margin-top: 2px; color: var(--dashboard-red); font-size: 1.2rem; }
.dashboard-toast strong { display: block; color: #40131f; font-size: .92rem; }
.dashboard-toast p { margin: 3px 0 0; font-size: .86rem; line-height: 1.4; }
.dashboard-toast button { width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent; color: #6f5660; font-size: 1.35rem; line-height: 1; }
.dashboard-toast--warning { border-color: #ead19b; color: #6b4c0c; }
.dashboard-toast--warning > i { color: #c4880c; }
.dashboard-toast--warning strong { color: #513807; }
.dashboard-toast--success { border-color: #a8dab6; color: #17652e; box-shadow: 0 16px 40px rgba(20, 91, 42, .18); }
.dashboard-toast--success > i { color: var(--dashboard-green); }
.dashboard-toast--success strong { color: #114d24; }
@keyframes toast-in { from { opacity: 0; transform: translateY(-10px) scale(.98); } }


/* Mobile bottom navigation (visible under 850px) */
.bottom-nav {
  display: none;
}

/*
  Original GlobalFooter action-bar CSS moved here for reference. The current
  liquid-glass .bottom-nav styles below remain active.

  .footer-actions {
    position: fixed;
    top: 18px;
    right: 18px;
    z-index: 950;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    width: 158px;
    padding: 8px;
    border: 1px solid var(--black-08);
    border-radius: 999px;
    background: var(--white-92);
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(12px);
  }

  .footer-actions a {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr);
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 42px;
    padding: 8px 14px;
    border: 0;
    border-radius: 999px;
    background: var(--white);
    color: var(--ink);
    box-shadow: 0 2px 10px var(--black-08);
    font-size: 9pt;
    font-weight: 600;
    letter-spacing: .04em;
    line-height: 1.1;
    text-transform: uppercase;
  }

  @media (max-width: 640px) {
    .footer-actions {
      top: auto;
      right: 12px;
      bottom: calc(12px + env(safe-area-inset-bottom));
      left: 12px;
      width: auto;
      flex-direction: row;
      justify-content: center;
    }

    .footer-actions a {
      display: inline-flex;
      flex: 1 1 0;
      min-width: 0;
      min-height: 58px;
      padding: 6px 4px;
    }
  }
*/

@media (max-width: 850px) {
  .dashboard-shell {
    --mobile-nav-height: calc(96px + env(safe-area-inset-bottom));
    position: fixed;
    inset: 0;
    overflow: hidden;
    overscroll-behavior: none;
    background: #fff;
  }

  .toast-region { top: 10px; right: 10px; left: 10px; width: auto; }

  .dashboard-layout {
    position: absolute;
    inset: 0;
    height: auto;
    min-height: 0;
    overflow: hidden;
    background: #fff;
  }

  .sidebar {
    display: none;
  }

  .content {
    box-sizing: border-box;
    height: 100%;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
    background: #fff;
    padding: 14px 12px;
    padding-bottom: var(--mobile-nav-height);
  }

  .bottom-nav {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    min-height: 68px;
    overflow: visible;
    isolation: isolate;
    background: linear-gradient(180deg, rgba(255, 255, 255, .58), rgba(239, 250, 242, .4));
    border: 1px solid rgba(255, 255, 255, .76);
    border-radius: 999px;
    box-shadow:
      0 18px 42px rgba(17, 55, 30, .16),
      0 3px 10px rgba(17, 55, 30, .08),
      inset 0 1px 1px rgba(255, 255, 255, .96),
      inset 0 -1px 1px rgba(21, 103, 47, .1);
    backdrop-filter: blur(28px) saturate(190%) contrast(105%);
    -webkit-backdrop-filter: blur(28px) saturate(190%) contrast(105%);
    z-index: 1000;
    gap: 5px;
    padding: 7px;
    justify-content: space-between;
    align-items: center;
    touch-action: pan-y;
  }

  .bottom-nav::before {
    content: '';
    position: absolute;
    z-index: 2;
    inset: 1px 5% auto;
    height: 46%;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(255, 255, 255, .76), rgba(255, 255, 255, 0));
    pointer-events: none;
    opacity: .78;
  }

  .bottom-nav::after {
    content: '';
    position: absolute;
    z-index: 0;
    inset: 5px;
    border-radius: inherit;
    background: linear-gradient(90deg, rgba(208, 244, 218, .14), rgba(255, 255, 255, .34), rgba(208, 244, 218, .14));
    filter: blur(7px);
    pointer-events: none;
  }

  .bottom-nav-lens {
    position: absolute;
    z-index: 1;
    top: 7px;
    bottom: 7px;
    left: 7px;
    width: calc((100% - 34px) / 5);
    border: 1px solid rgba(255, 255, 255, .88);
    border-radius: 999px;
    background:
      radial-gradient(circle at 50% 18%, rgba(255, 255, 255, .78) 0 18%, rgba(255, 255, 255, 0) 54%),
      linear-gradient(145deg, rgba(231, 255, 238, .7), rgba(102, 201, 131, .38));
    box-shadow:
      0 8px 22px rgba(20, 105, 48, .2),
      0 1px 4px rgba(14, 69, 31, .12),
      inset 0 1.5px 1px rgba(255, 255, 255, .98),
      inset 0 -1px 2px rgba(20, 119, 51, .18);
    backdrop-filter: blur(18px) saturate(210%);
    -webkit-backdrop-filter: blur(18px) saturate(210%);
    pointer-events: none;
    transition: transform 320ms cubic-bezier(.2, .82, .2, 1);
    will-change: transform;
  }

  .bottom-nav-lens--0 { transform: translateX(0); }
  .bottom-nav-lens--1 { transform: translateX(calc(100% + 5px)); }
  .bottom-nav-lens--2 { transform: translateX(calc(200% + 10px)); }
  .bottom-nav-lens--3 { transform: translateX(calc(300% + 15px)); }
  .bottom-nav-lens--4 { transform: translateX(calc(400% + 20px)); }

  .bottom-nav-lens::after {
    content: '';
    position: absolute;
    inset: 4px 10% auto;
    height: 30%;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(255, 255, 255, .72), rgba(255, 255, 255, 0));
    filter: blur(.3px);
  }

  .bottom-tab {
    position: relative;
    z-index: 3;
    grid-row: 1;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 54px;
    padding: 7px 4px 6px;
    margin: 0;
    border-radius: 999px;
    background: transparent;
    border: 1px solid transparent;
    text-decoration: none;
    color: #25442e;
    box-shadow: none;
    font-size: .68rem;
    font-weight: 650;
    letter-spacing: .015em;
    user-select: none;
    -webkit-user-drag: none;
    transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  }

  .menu-icon {
    font-size: 1rem;
    line-height: 1;
    color: var(--dashboard-green);
  }

  /* icon spacing for sidebar (row) */
  .sidebar-btn .menu-icon {
    margin-right: 10px;
  }

  /* icon spacing for bottom tabs (column) */
  .bottom-tab .menu-icon {
    margin-bottom: 5px;
  }

  .bottom-tab.active {
    background: transparent;
    border-color: transparent;
    color: #0d6a2b;
    box-shadow: none;
    transform: translateY(-.5px) scale(1.025);
  }

  .bottom-tab.active .menu-icon {
    color: #16813a;
    filter: drop-shadow(0 1px 1px rgba(255, 255, 255, .9));
  }

  .bottom-tab:hover:not(.active),
  .bottom-tab:focus-visible:not(.active) {
    background: rgba(255, 255, 255, .22);
    border-color: rgba(255, 255, 255, .34);
    color: #176c31;
  }

  .bottom-tab:focus-visible {
    outline: 2px solid rgba(46, 164, 79, .65);
    outline-offset: 2px;
  }

  .bottom-tab.drag-preview {
    transform: scale(.96);
    transition: transform 90ms ease-out, background 90ms ease-out;
  }

  @media (max-width: 430px) {
    .bottom-nav {
      left: 8px;
      right: 8px;
      gap: 3px;
      padding: 6px;
    }

    .bottom-nav-lens {
      top: 6px;
      bottom: 6px;
      left: 6px;
      width: calc((100% - 24px) / 5);
    }

    .bottom-nav-lens--1 { transform: translateX(calc(100% + 3px)); }
    .bottom-nav-lens--2 { transform: translateX(calc(200% + 6px)); }
    .bottom-nav-lens--3 { transform: translateX(calc(300% + 9px)); }
    .bottom-nav-lens--4 { transform: translateX(calc(400% + 12px)); }

    .bottom-tab {
      min-height: 52px;
      font-size: .64rem;
    }
  }

  .logout-tab * {
    color: var(--dashboard-red);
  }
}
</style>
