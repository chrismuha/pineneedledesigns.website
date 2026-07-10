<script setup>
import { onMounted, ref } from 'vue'
import { dashboardApi } from '../../api/dashboard.js'

const loading = ref(true)
const error = ref('')
const stats = ref({
  productCount: 0,
  collectionCount: 0,
  openOrderCount: 0,
  closedOrderCount: 0,
  recentProducts: [],
  recentOrders: [],
})

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`

const orderLabel = (order) => (order.orderNumber ? `#${order.orderNumber}` : 'Order')

const loadStats = async () => {
  loading.value = true
  error.value = ''

  try {
    stats.value = await dashboardApi.getStats()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

onMounted(loadStats)
</script>

<template>
  <div class="dashboard-home dashboard-page">
    <div class="page-header">
      <h1>Dashboard</h1>
      <div class="header-actions">
        <RouterLink class="new-item-btn btn-primary" to="/dashboard/create">Add New Item</RouterLink>
        <RouterLink class="new-item-btn btn-primary" to="/dashboard/items">Edit Items</RouterLink>
      </div>
    </div>

    <p v-if="error" class="error-banner">{{ error }}</p>
    <p v-if="loading" class="status-text">Loading dashboard...</p>

    <section v-else class="stats-grid">
      <article class="stat-card">
        <h2>{{ stats.productCount }}</h2>
        <p>Total Items</p>
      </article>

      <RouterLink to="/dashboard/items" class="stat-card stat-card-link">
        <h2>{{ stats.collectionCount }}</h2>
        <p>Collections</p>
      </RouterLink>

      <RouterLink :to="{ path: '/dashboard/orders', query: { status: 'open' } }" class="stat-card stat-card-link">
        <h2>{{ stats.openOrderCount }}</h2>
        <p>Open Orders</p>
      </RouterLink>

      <RouterLink :to="{ path: '/dashboard/orders', query: { status: 'closed' } }" class="stat-card stat-card-link">
        <h2>{{ stats.closedOrderCount }}</h2>
        <p>Closed Orders</p>
      </RouterLink>
    </section>

    <section v-if="!loading" class="recent-section">
      <div class="section-header">
        <h2>Recent Orders</h2>
        <RouterLink class="btn-primary" to="/dashboard/orders">View all orders</RouterLink>
      </div>

      <p v-if="!stats.recentOrders?.length" class="status-text">
        No orders yet. Completed checkout orders will appear here.
      </p>

      <div v-else class="recent-list">
        <article v-for="order in stats.recentOrders" :key="order._id" class="recent-card">
          <div>
            <h3>{{ orderLabel(order) }}</h3>
            <p>{{ order.customer?.email || 'No email' }}</p>
            <p class="recent-date">
              {{ formatMoney(order.summary?.finalTotal) }} ·
              {{ order.status === 'open' ? 'Open' : 'Closed' }} ·
              {{ formatDate(order.createdAt) }}
            </p>
          </div>
        </article>
      </div>
    </section>

    <section v-if="!loading" class="recent-section">
      <div class="section-header">
        <h2>Recent Items</h2>
        <RouterLink class="btn-primary" to="/dashboard/items">View all items</RouterLink>
      </div>

      <p v-if="!stats.recentProducts.length" class="status-text">
        No items yet. Create your first product to get started.
      </p>

      <div v-else class="recent-list">
        <RouterLink v-for="product in stats.recentProducts" :key="product._id" class="recent-card recent-card-link" :to="{ path: '/dashboard/items', query: { item: product._id } }">
          <img
            v-if="product.photos?.[0]"
            :src="product.photos[0]"
            :alt="product.name"
            class="recent-photo"
          >
          <div>
            <h3>{{ product.name }}</h3>
            <p>${{ Number(product.price).toFixed(2) }}</p>
            <p class="recent-date">{{ formatDate(product.createdAt) }}</p>
          </div>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style src="../../styles/dashboard.css"></style>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
}

.stat-card-link {
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease;
}

.stat-card-link:hover {
  border-color: var(--dashboard-green);
}

.stat-card,
.recent-section {
  background: white;
  border: 1px solid #d8eadb;
  border-radius: 14px;
  padding: 24px;
}

.stat-card h2 {
  margin: 0 0 8px;
  color: #1f7a3d;
  font-size: 2rem;
}

.stat-card p,
.recent-date,
.status-text {
  color: #666;
}

.recent-section {
  margin-top: 24px;
}

.recent-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.recent-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
}
.recent-card-link { color: inherit; text-decoration: none; }
.recent-card-link:hover { border-color: var(--dashboard-green); }

.recent-photo {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
}

.recent-card h3 {
  margin: 0 0 4px;
}

.error-banner {
  background: #ffe2e2;
  color: #8a1f1f;
  padding: 12px 16px;
  border-radius: 8px;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
