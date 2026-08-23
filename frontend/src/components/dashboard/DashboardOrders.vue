<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { dashboardApi } from '../../api/dashboard.js'
import DashboardConfirmDialog from './DashboardConfirmDialog.vue'

const route = useRoute()
const orders = ref([])
const loading = ref(true)
const error = ref('')
const savingOrderId = ref('')
const statusFilter = ref('all')
const pendingDeleteOrder = ref(null)
const editingOrderId = ref('')
const editItems = ref([])
const products = ref([])
const routeStatus = () => ['open', 'closed'].includes(String(route.query.status))
  ? String(route.query.status)
  : 'all'

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
]

const filteredOrders = computed(() => {
  if (statusFilter.value === 'all') {
    return orders.value
  }
  return orders.value.filter((order) => order.status === statusFilter.value)
})

const openCount = computed(() => orders.value.filter((order) => order.status === 'open').length)
const closedCount = computed(() => orders.value.filter((order) => order.status === 'closed').length)

const loadOrders = async () => {
  loading.value = true
  error.value = ''

  try {
    orders.value = await dashboardApi.getOrders('all')
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

const formatTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`

const orderLabel = (order) => {
  if (order.orderNumber) {
    return `#${order.orderNumber}`
  }
  const suffix = order.paypalOrderId?.slice(-6) || order.gatewayOrderId?.slice(-6) || order._id?.slice(-6) || '000000'
  return `#${suffix.toUpperCase()}`
}

const addressesMatch = (order) => {
  const billing = order.billingAddress || {}
  const shipping = order.shippingAddress || {}
  return JSON.stringify(billing) === JSON.stringify(shipping)
}

const formatAddress = (address = {}) => {
  const lines = [
    address.name,
    address.address1,
    address.address2,
    [address.city, address.state, address.zip].filter(Boolean).join(', '),
    address.county ? address.county : null,
  ].filter(Boolean)

  return lines
}

const displayLineItems = (order) => {
  if (order.lineItems?.length) {
    return order.lineItems
  }

  return (order.items || []).map((item) => ({
    title: item.name,
    quantity: Number(item.quantity || 1),
    subtotal: Number(item.unit_amount?.value || item.unitAmount?.value || 0) * Number(item.quantity || 1),
    discountAmount: 0,
    discountPercentDisplay: '0%',
    taxAmount: 0,
    taxRateDisplay: '0%',
    lineTotal: Number(item.unit_amount?.value || item.unitAmount?.value || 0) * Number(item.quantity || 1),
  }))
}

const totalWithoutTax = (order) => {
  if (order.summary?.discountedTotal !== undefined) {
    return order.summary.discountedTotal
  }
  return Math.max(0, Number(order.summary?.subtotal || 0) - Number(order.summary?.discount || 0))
}

const taxBreakdown = (order) => order.tax?.breakdown || []

const updateStatus = async (order, status) => {
  savingOrderId.value = order._id

  try {
    const updated = await dashboardApi.updateOrderStatus(order._id, status)
    orders.value = orders.value.map((entry) => (
      entry._id === updated._id ? updated : entry
    ))
  } catch (err) {
    error.value = err.message
  } finally {
    savingOrderId.value = ''
  }
}

const requestDelete = (order) => { pendingDeleteOrder.value = order }
const confirmDelete = async () => {
  if (!pendingDeleteOrder.value) return
  const order = pendingDeleteOrder.value
  savingOrderId.value = order._id
  error.value = ''
  try {
    const updated = await dashboardApi.deleteOrder(order._id)
    orders.value = orders.value.map((entry) => entry._id === updated._id ? updated : entry)
  } catch (err) {
    error.value = err.message
  } finally {
    savingOrderId.value = ''
    pendingDeleteOrder.value = null
  }
}

const beginEdit = async (order) => {
  error.value = ''
  try {
    if (!products.value.length) products.value = await dashboardApi.getProducts()
    editItems.value = (order.inventoryLines || []).map((line) => ({
      productId: String(line.productId),
      quantity: Number(line.quantity || 1),
    }))
    editingOrderId.value = order._id
  } catch (err) {
    error.value = err.message
  }
}
const addEditItem = () => {
  const available = products.value.find((product) => !editItems.value.some((item) => item.productId === product._id))
  if (available) editItems.value.push({ productId: available._id, quantity: 1 })
}
const removeEditItem = (index) => editItems.value.splice(index, 1)
const saveOrderChange = async (order) => {
  savingOrderId.value = order._id
  error.value = ''
  try {
    const result = await dashboardApi.changeOrder(order._id, editItems.value)
    const updated = result.order
    orders.value = orders.value.map((entry) => entry._id === updated._id ? updated : entry)
    editingOrderId.value = ''
  } catch (err) {
    error.value = err.message
  } finally {
    savingOrderId.value = ''
  }
}

onMounted(() => {
  statusFilter.value = routeStatus()
  loadOrders()
})
watch(
  () => route.query.status,
  () => {
    statusFilter.value = routeStatus()
    if (route.path === '/dashboard/orders') {
      loadOrders()
    }
  },
)
</script>

<template>
  <div class="orders-page dashboard-page">
    <div class="page-header">
      <div>
        <h1>Orders</h1>
        <p class="page-subtitle">
          {{ openCount }} open · {{ closedCount }} closed
        </p>
      </div>
      <button type="button" class="btn-outline" :disabled="loading" @click="loadOrders">
        Refresh
      </button>
    </div>

    <div class="filter-tabs">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="filter-tab"
        :class="{ active: statusFilter === option.value }"
        @click="statusFilter = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <p v-if="error" class="error-banner">{{ error }}</p>

    <p v-if="loading" class="status-text">Loading orders...</p>
    <p v-else-if="!orders.length" class="status-text">
      No orders yet. Completed checkout orders will appear here after Clover payment.
    </p>
    <p v-else-if="!filteredOrders.length" class="status-text">
      No {{ statusFilter }} orders found.
    </p>

    <div v-else class="orders-list">
      <details
        :id="`order-${order._id}`"
        v-for="order in filteredOrders"
        :key="order._id"
        class="order-card"
        :open="order.status === 'open' || String(route.query.order || '') === String(order._id)"
      >
        <summary>
          <div class="order-summary">
            <div>
              <strong>{{ orderLabel(order) }}</strong><br>
              <span>{{ formatDate(order.createdAt) }}</span><br>
              <span>{{ order.customer?.email || 'No email' }}</span>
            </div>

            <div class="order-badges">
              <span class="badge" :class="order.status === 'open' ? 'badge-open' : 'badge-closed'">
                {{ order.status === 'open' ? 'OPEN' : 'CLOSED' }}
              </span>
              <span class="badge badge-paid">
                {{ formatMoney(order.summary?.finalTotal) }}
              </span>
            </div>
          </div>
        </summary>

        <div class="order-content">
          <section class="order-section">
            <h3>Customer Information</h3>

            <div class="info-grid">
              <div>
                <label>Email</label>
                <p>{{ order.customer?.email || '—' }}</p>
              </div>

              <div>
                <label>Phone</label>
                <p>{{ order.customer?.phone || '—' }}</p>
              </div>

              <div>
                <label>Customer Type</label>
                <p>{{ order.customer?.type || '—' }}</p>
              </div>
            </div>
          </section>

          <section v-if="editingOrderId === order._id" class="order-section order-editor">
            <h3>Edit Order Items</h3>
            <p class="editor-note">A higher total sends the customer a secure Clover payment link. A lower total is refunded before the order changes.</p>
            <div v-for="(item, index) in editItems" :key="`edit-${order._id}-${index}`" class="editor-row">
              <select v-model="item.productId" class="form-input">
                <option v-for="product in products" :key="product._id" :value="product._id">
                  {{ product.name }} — {{ formatMoney(product.price) }} ({{ product.quantity }} available)
                </option>
              </select>
              <input v-model.number="item.quantity" class="form-input quantity-input" type="number" min="1" step="1" aria-label="Quantity">
              <button type="button" class="btn-outline" @click="removeEditItem(index)">Remove</button>
            </div>
            <div class="editor-actions">
              <button type="button" class="btn-outline" @click="addEditItem">Add Item</button>
              <button type="button" class="btn-primary" :disabled="savingOrderId === order._id || !editItems.length" @click="saveOrderChange(order)">Save Order Change</button>
              <button type="button" class="btn-outline" @click="editingOrderId = ''">Cancel Editing</button>
            </div>
          </section>

          <section class="order-section">
            <h3>Billing Address</h3>
            <p v-for="(line, index) in formatAddress(order.billingAddress)" :key="`billing-${index}`">
              {{ line }}
            </p>
          </section>

          <section class="order-section">
            <h3>Shipping Address</h3>
            <p v-if="addressesMatch(order)" class="same-address">
              Same as billing address
            </p>
            <template v-else>
              <p v-for="(line, index) in formatAddress(order.shippingAddress)" :key="`shipping-${index}`">
                {{ line }}
              </p>
            </template>
          </section>

          <section class="order-section">
            <h3>Order Items</h3>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>Tax</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(line, index) in displayLineItems(order)" :key="`${order._id}-line-${index}`">
                  <td>{{ line.title }}</td>
                  <td>{{ line.quantity }}</td>
                  <td>{{ formatMoney(line.subtotal) }}</td>
                  <td>{{ line.discountPercentDisplay || '0%' }} ({{ formatMoney(line.discountAmount) }})</td>
                  <td>{{ line.taxRateDisplay || '0%' }} ({{ formatMoney(line.taxAmount) }})</td>
                  <td>{{ formatMoney(line.lineTotal) }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="order-section">
            <h3>Totals</h3>

            <div class="totals">
              <div><span>Subtotal</span><span>{{ formatMoney(order.summary?.subtotal) }}</span></div>
              <div><span>Discount</span><span>-{{ formatMoney(order.summary?.discount) }}</span></div>
              <div><span>Discounted merchandise</span><span>{{ formatMoney(totalWithoutTax(order)) }}</span></div>
              <div><span>Shipping</span><span>{{ formatMoney(order.summary?.shipping) }}</span></div>
              <div><span>Tax</span><span>{{ formatMoney(order.summary?.tax) }}</span></div>
              <div class="final-total">
                <span>Final Total</span>
                <span>{{ formatMoney(order.summary?.finalTotal) }}</span>
              </div>
            </div>
          </section>

          <section v-if="order.discountCode" class="order-section">
            <h3>Discount Code</h3>
            <p>{{ order.discountCode }}</p>
          </section>

          <section v-if="taxBreakdown(order).length" class="order-section">
            <h3>Tax Breakdown</h3>
            <p v-if="order.tax?.label">{{ order.tax.label }}</p>
            <ul>
              <li v-for="(row, index) in taxBreakdown(order)" :key="`${order._id}-tax-${index}`">
                {{ row.label }}: {{ row.rate }} ({{ formatMoney(row.amount) }})
              </li>
            </ul>
          </section>

          <section class="order-section">
            <h3>Order Timeline</h3>

            <div class="timeline">
              <div
                v-for="(entry, index) in order.timeline"
                :key="`${order._id}-timeline-${index}`"
              >
                {{ formatTime(entry.at) }} - {{ entry.label }}
              </div>
            </div>
          </section>

          <p v-if="order.paypalOrderId" class="paypal-id">
            Legacy PayPal order: {{ order.paypalOrderId }}
          </p>
          <p v-else-if="order.gatewayOrderId" class="paypal-id">
            Clover reference: {{ order.gatewayOrderId }}
          </p>

          <div class="order-actions">
            <button v-if="!order.inventoryReturnedAt && !order.pendingChange" type="button" class="btn-primary" :disabled="savingOrderId === order._id" @click="beginEdit(order)">Add or Change Items</button>
            <span v-if="order.pendingChange" class="badge badge-paid">Awaiting additional payment</span>
            <span v-if="order.inventoryReturnedAt" class="badge badge-closed">Canceled · inventory returned</span>
            <button
              v-if="order.resolution === 'active' && order.status === 'open'"
              type="button"
              class="btn-danger"
              :disabled="savingOrderId === order._id"
              @click="updateStatus(order, 'closed')"
            >
              Close Order
            </button>

            <button
              v-else-if="order.resolution === 'active'"
              type="button"
              class="btn-primary"
              :disabled="savingOrderId === order._id"
              @click="updateStatus(order, 'open')"
            >
              Reopen Order
            </button>
            <button
              v-if="!order.inventoryReturnedAt && !order.pendingChange"
              type="button"
              class="btn-danger"
              :disabled="savingOrderId === order._id"
              @click="requestDelete(order)"
            >
              Cancel Order &amp; Refund
            </button>
          </div>
        </div>
      </details>
    </div>
    <DashboardConfirmDialog
      :open="Boolean(pendingDeleteOrder)"
      title="Cancel order and refund payment?"
      :message="`${pendingDeleteOrder ? orderLabel(pendingDeleteOrder) : 'This order'} will be canceled, refunded through Clover, restocked, and the customer will be notified. If the refund fails, the order will remain unchanged.`"
      confirm-label="Cancel & Refund"
      :busy="Boolean(savingOrderId)"
      @confirm="confirmDelete"
      @cancel="pendingDeleteOrder = null"
    />
  </div>
</template>

<style src="../../styles/dashboard.css"></style>

<style scoped>
.page-subtitle {
  color: var(--dashboard-orders-page-description-text);
  margin: 4px 0 0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.filter-tab {
  background: var(--dashboard-orders-filter-tab-surface);
  border: 1px solid var(--dashboard-orders-filter-tab-border);
  color: var(--dashboard-orders-filter-tab-text);
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
}

.filter-tab.active {
  background: var(--dashboard-primary-action-color);
  border-color: var(--dashboard-primary-action-color);
  color: var(--dashboard-orders-active-filter-tab-text);
}

.filter-tab {
  background: var(--dashboard-orders-filter-tab-surface);
  border: 1px solid var(--dashboard-orders-filter-tab-border);
  color: var(--dashboard-orders-filter-tab-text);
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  border: 1px solid var(--dashboard-orders-order-card-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--dashboard-orders-card-surface);
}

.order-card summary {
  padding: 18px;
  cursor: pointer;
  list-style: none;
}

.order-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.order-content {
  padding: 24px;
  border-top: 1px solid var(--dashboard-orders-order-content-border);
}

.order-section {
  margin-bottom: 30px;
}

.order-section h3 {
  color: var(--dashboard-primary-action-color);
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 10px;
  border: 1px solid var(--dashboard-orders-items-table-td-border);
}

.totals {
  display: grid;
  gap: 10px;
  max-width: 420px;
}

.totals > div {
  display: flex;
  justify-content: space-between;
}

.final-total {
  font-weight: 700;
  padding-top: 8px;
  border-top: 1px solid var(--dashboard-orders-final-total-border);
}

.badge {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 9.6pt;
}

.badge-paid {
  background: var(--dashboard-orders-badge-paid-surface);
}

.badge-open {
  background: var(--dashboard-orders-badge-open-surface);
}

.badge-closed {
  background: var(--dashboard-orders-badge-closed-surface);
}

.order-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.order-actions {
  display: flex;
  gap: 12px;
}

.close-btn,
.reopen-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--dashboard-orders-action-button-text);
}

.close-btn {
  background: var(--dashboard-destructive-action-color);
}

.reopen-btn {
  background: var(--dashboard-primary-action-color);
}

.same-address,
.status-text,
.paypal-id {
  color: var(--dashboard-orders-paypal-id-text);
}

.paypal-id {
  font-size: 10.8pt;
  margin-bottom: 16px;
}

.error-banner {
  background: var(--dashboard-orders-error-banner-surface);
  color: var(--dashboard-orders-error-banner-text);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.order-editor { padding: 18px; border: 1px solid var(--dashboard-orders-order-card-border); border-radius: 10px; }
.editor-note { color: var(--dashboard-orders-paypal-id-text); }
.editor-row { display: grid; grid-template-columns: minmax(220px, 1fr) 90px auto; gap: 10px; margin: 10px 0; }
.form-input { width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid var(--dashboard-orders-items-table-td-border); border-radius: 8px; }
.editor-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }

@media (max-width: 768px) {
  .page-header > div {
    width: 100%;
    text-align: center;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
  .order-summary { align-items: flex-start; }
  .order-content { padding: 16px 12px; }
  .order-section { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .items-table { min-width: 680px; }
  .order-actions { flex-direction: column; align-items: stretch; }
  .editor-row { grid-template-columns: 1fr; }
  .order-actions button { width: 100%; min-height: 46px; }
}
</style>
