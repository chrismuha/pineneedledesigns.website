<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import LoginDialog from '../components/LoginDialog.vue'
import { useAuthStore } from '../stores/auth.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const authReady = ref(false)

const menuItems = [
  {
    label: 'Dashboard',
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
]

const isActive = (path) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard'
  }

  return route.path.startsWith(path)
}

const handleLogout = async () => {
  await authStore.logout()
  authReady.value = false
  authStore.openLoginDialog(route.fullPath)
}

const handleLoginSuccess = () => {
  authReady.value = true
}

const handleLoginCancel = async () => {
  if (!authStore.isAuthenticated) {
    await router.replace('/')
  }
}

onMounted(async () => {
  const isAuthed = await authStore.verifySession()

  if (!isAuthed) {
    authStore.openLoginDialog(route.fullPath)
    return
  }

  authReady.value = true
})
</script>

<template>
  <div>
    <div v-if="authReady" class="dashboard-layout">
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

            <p v-if="authStore.user?.email" class="user-email">{{ authStore.user.email }}</p>
            <button type="button" class="logout-btn" @click="handleLogout">
              <i class="bi bi-box-arrow-right menu-icon" aria-hidden="true"></i>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main class="content">
        <RouterView />
      </main>
    </div>

    <p v-else class="dashboard-loading">Checking access...</p>

    <LoginDialog required @success="handleLoginSuccess" @cancel="handleLoginCancel" />

    <!-- Mobile bottom nav for widths below 850px -->
    <nav class="bottom-nav" v-if="authReady">
      <RouterLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="bottom-tab"
        :class="{ active: isActive(item.to) }"
      >
        <i :class="['bi', item.icon, 'menu-icon']" aria-hidden="true"></i>
        <span class="label">{{ item.label }}</span>
      </RouterLink>

      <button type="button" class="bottom-tab logout-tab" @click="handleLogout">
        <i class="bi bi-box-arrow-right menu-icon" aria-hidden="true"></i>
        <span class="label">Sign out</span>
      </button>
    </nav>
  </div>
</template>

<style src="../styles/dashboard.css"></style>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
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

.user-email {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #666;
  word-break: break-word;
}


.logout-btn {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--dashboard-red);
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  background: #f7f7f7;
  color: var(--dashboard-red);
}

.logout-btn:hover {
  background: var(--dashboard-red);
  color: white;
}

.content {
  flex: 1;
  padding: 24px;
}

.dashboard-loading {
  min-height: 100vh;
  display: grid;
  place-items: center;
  margin: 0;
  color: #666;
}

/* Mobile bottom navigation (visible under 850px) */
.bottom-nav {
  display: none;
}

@media (max-width: 850px) {
  .sidebar {
    display: none;
  }

  .content {
    padding: 16px;
    padding-bottom: 80px; /* space for bottom nav */
  }

  .bottom-nav {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 64px;
    background: #fff;
    border-top: 1px solid #e6e6e6;
    z-index: 1000;
    gap: 4px;
    padding: 8px 12px;
    justify-content: space-between;
    align-items: center;
  }

  .bottom-tab {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 6px;
    margin: 0 4px;
    border-radius: 8px;
    background: transparent;
    border: none;
    text-decoration: none;
    color: inherit;
    font-size: 0.9rem;
  }

  .menu-icon {
    font-size: 1.2rem;
    line-height: 1;
  }

  /* icon spacing for sidebar (row) */
  .sidebar-btn .menu-icon {
    margin-right: 10px;
  }

  /* icon spacing for bottom tabs (column) */
  .bottom-tab .menu-icon {
    margin-bottom: 6px;
  }

  .bottom-tab.active {
    background: #f3f4f6;
    font-weight: 600;
  }

  .logout-tab {
    color: var(--dashboard-red);
  }
}
</style>
