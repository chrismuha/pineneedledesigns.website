<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

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
]

const isActive = (path) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard'
  }

  return route.path.startsWith(path)
}

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

    <!-- Mobile bottom nav for widths below 850px -->
    <nav class="bottom-nav">
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

    </nav>
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


/* Mobile bottom navigation (visible under 850px) */
.bottom-nav {
  display: none;
}

@media (max-width: 850px) {
  .dashboard-shell {
    --mobile-nav-height: calc(80px + env(safe-area-inset-bottom));
    position: fixed;
    inset: 0;
    overflow: hidden;
    overscroll-behavior: none;
    background: #fff;
  }

  .dashboard-layout {
    position: absolute;
    inset: 0 0 var(--mobile-nav-height);
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
    padding-bottom: 14px;
  }

  .bottom-nav {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    min-height: 64px;
    background: #fff;
    border-top: 1px solid #e6e6e6;
    z-index: 1000;
    gap: 4px;
    padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
    justify-content: space-between;
    align-items: center;
    touch-action: manipulation;
  }

  .bottom-tab {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 0px;
    margin: 0 4px;
    border-radius: 8px;
    background: transparent;
    border: none;
    text-decoration: none;
    color: inherit;
    font-size: 0.7rem;
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
    margin-bottom: 6px;
  }

  .bottom-tab.active {
    background: #d0d0d0;
  }

  .logout-tab * {
    color: var(--dashboard-red);
  }
}
</style>
