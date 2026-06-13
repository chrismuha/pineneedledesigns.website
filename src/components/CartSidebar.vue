<template>
  <div v-if="cartStore.isOpen" class="cart-sidebar-overlay" @click="cartStore.close">
    <div class="cart-sidebar" @click.stop>
      <div class="cart-header">
        <h2>Your Cart</h2>
        <button class="close-btn" @click="cartStore.close">&times;</button>
      </div>
      <div v-if="cartStore.isLoading" class="loading">
        <p>Loading cart...</p>
      </div>
      <div v-else-if="cartStore.items.length === 0" class="empty-cart">
        <p>Your cart is empty.</p>
        <router-link to="/collections" class="btn" @click="cartStore.close">Browse Collections</router-link>
      </div>
      <div v-else class="cart-items">
        <div v-for="item in cartStore.items" :key="item.cartItemId || item.id" class="cart-item">
          <div class="item-row">
            <div class="item-image-wrap">
              <img :src="itemImage(item)" :alt="item.title" class="item-image" loading="lazy" decoding="async" />
            </div>
            <div class="item-main">
              <h3>{{ item.title }}</h3>
              <span class="item-price">${{ item.price.toFixed(2) }}</span>
            </div>
          </div>
          <div class="item-actions">
            <div class="item-controls">
              <button type="button" class="qty-btn" @click="updateQuantity(item.cartItemId || item.id, item.quantity - 1)">−</button>
              <span class="quantity">{{ item.quantity }}</span>
              <button type="button" class="qty-btn" @click="updateQuantity(item.cartItemId || item.id, item.quantity + 1)">+</button>
            </div>
            <button type="button" class="remove-button" @click="removeItem(item.cartItemId || item.id)">Remove</button>
          </div>
          <div class="item-footer">
            <span class="item-total-label">Total</span>
            <strong class="item-total-value">${{ (item.price * item.quantity).toFixed(2) }}</strong>
          </div>
        </div>
        <div class="discount-box">
          <label for="discount-code">Discount Code</label>
          <div class="discount-input-row">
            <input
              id="discount-code"
              type="text"
              v-model="codeInput"
              :placeholder="cartStore.appliedDiscountCode ? 'You\'ve already used a code.' : 'Enter Code'"
              @keyup.enter="applyCoupon"
              :disabled="Boolean(cartStore.appliedDiscountCode)"
            />
            <button class="btn apply-btn" @click="applyCoupon">
              {{ cartStore.appliedDiscountCode ? 'Clear all discounts' : 'Apply' }}
            </button>
          </div>
          <p v-if="cartStore.discountError" class="discount-error">{{ cartStore.discountError }}</p>
          <p v-else-if="cartStore.discountDescription" class="discount-description">{{ cartStore.discountDescription }}</p>
          <p v-if="cartStore.discountAmount > 0" class="discount-amount">
            You saved ${{ cartStore.discountAmount.toFixed(2) }}
          </p>
        </div>
        <div class="cart-summary">
          <p>Total Items: {{ cartStore.totalItems }}</p>
          <p>Total Price: ${{ cartStore.totalPrice.toFixed(2) }}</p>
          <p v-if="cartStore.discountAmount > 0">Discount: -${{ cartStore.discountAmount.toFixed(2) }}</p>
          <p v-if="cartStore.discountAmount > 0" class="discount-amount-summary">You saved ${{ cartStore.discountAmount.toFixed(2) }}</p>
          <p class="cart-final-total">Final Total: ${{ cartStore.discountedTotal.toFixed(2) }}</p>
          <button @click="clearCart" class="btn">Clear Cart</button>
          <button v-if="!showCheckoutForm" @click="checkout" class="btn btn-primary">Checkout</button>
        </div>
      </div>
      <div v-if="showCheckoutForm" class="checkout-popup-overlay" @click="handlePopupBackdropClick">
        <div class="checkout-popup" @click.stop>
          <button type="button" class="popup-close" @click="showCheckoutForm = false">×</button>
          <h3>Checkout details</h3>
          <p class="popup-subtitle">Please enter your name, email, and location before proceeding to payment.</p>

          <label for="customer-name">Name</label>
          <input id="customer-name" type="text" v-model="customerName" placeholder="Full name" />

          <label for="customer-email">Email</label>
          <input id="customer-email" type="email" v-model="customerEmail" placeholder="Email address" />

          <label for="customer-location">Location</label>
          <select id="customer-location" v-model="customerLocation">
            <option disabled value="">Select location</option>
            <option>Oneida County</option>
            <option>Elsewhere in NY</option>
          </select>

          <p class="checkout-note">These information are required for proper tax calculations.</p>
          <p v-if="checkoutError" class="checkout-error">{{ checkoutError }}</p>

          <div class="checkout-actions">
            <button type="button" class="btn btn-secondary" @click="showCheckoutForm = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="submitCheckout">Proceed to payment</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCartStore } from '../stores/cart'

const cartStore = useCartStore()
const codeInput = ref('')
const showCheckoutForm = ref(false)
const customerName = ref('')
const customerEmail = ref('')
const customerLocation = ref('')
const checkoutError = ref('')

const itemImage = (item) => {
  return item.images?.[0] || item.image || item.placeholderImage || item.placeholderImages?.[0] || '/images/comingsoon/comingsoon015.webp'
}

const updateQuantity = async (id, quantity) => {
  await cartStore.updateQuantity(id, quantity)
}

const removeItem = async (id) => {
  await cartStore.removeItem(id)
}

const clearCart = async () => {
  await cartStore.clearCart()
}

const applyCoupon = () => {
  if (cartStore.appliedDiscountCode) {
    cartStore.clearDiscount()
    codeInput.value = ''
    return
  }

  if (cartStore.applyDiscountCode(codeInput.value)) {
    codeInput.value = ''
  }
}

const checkout = () => {
  showCheckoutForm.value = true
}

const handlePopupBackdropClick = () => {
  // keep popup open unless user explicitly cancels
}

const submitCheckout = async () => {
  checkoutError.value = ''

  if (!customerName.value.trim() || !customerEmail.value.trim() || !customerLocation.value) {
    checkoutError.value = 'Please provide your name, email, and location.'
    return
  }

  const request = await fetch(`/api/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: cartStore.appliedDiscountCode,
      customer: {
        name: customerName.value.trim(),
        email: customerEmail.value.trim(),
        location: customerLocation.value,
      },
    })
  })

  const data = await request.json();

  if (!request.ok) {
    checkoutError.value = data.error || 'Unable to start checkout. Please try again.'
    return
  }

  window.location.href = data.url
}
</script>

<style scoped>
.cart-sidebar-overlay {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: var(--black-50);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.cart-sidebar {
  width: 400px;
  max-width: 90vw;
  height: 100%;
  background: var(--white);
  box-shadow: -2px 0 5px var(--black-10);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--line);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18pt;
  cursor: pointer;
}

.empty-cart {
  padding: 20px;
  text-align: center;
}

.loading {
  padding: 20px;
  text-align: center;
  color: var(--cart-muted);
}

.cart-items {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(34, 49, 63, 0.12);
  background: #f9fbfd;
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 12px;
}

.item-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.item-image-wrap {
  flex: 0 0 100px;
  position: relative;
  min-width: 100px;
  height: 100px;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(34, 49, 63, 0.06);
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex: 1;
}

.item-main h3 {
  font-size: 1rem;
  margin: 0;
}

.item-price {
  color: #0d6efd;
  font-weight: 700;
  font-size: 1.05rem;
}

.item-actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-total {
  grid-area: total;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
  gap: 6px;
  text-align: right;
  min-width: 90px;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qty-btn,
.remove-button {
  border: none;
  border-radius: 999px;
  min-width: 38px;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.qty-btn {
  background: #fff;
  color: #0d6efd;
  box-shadow: 0 6px 16px rgba(13, 110, 253, 0.08);
}

.qty-btn:hover {
  transform: translateY(-1px);
  background: #e7f1ff;
}

.quantity {
  min-width: 32px;
  text-align: center;
  font-weight: 700;
  color: #1f2937;
}

.remove-button {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  padding: 0 14px;
}

.remove-button:hover {
  background: rgba(220, 38, 38, 0.16);
}

@media (max-width: 720px) {
  .item-row {
    flex-direction: column;
    gap: 12px;
  }

  .item-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

.item-total-label {
  font-size: 0.82rem;
  color: #6b7280;
}

.item-total-value {
  font-size: 1.05rem;
  color: #111827;
  font-weight: 700;
}

.cart-summary {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  text-align: center;
}

.checkout-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);
}

.checkout-popup {
  width: min(600px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  background: white;
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 32px 90px rgba(0, 0, 0, 0.32);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.popup-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: #333;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.checkout-popup h3 {
  margin: 0 0 12px;
  font-size: 1.45rem;
}

.popup-subtitle {
  margin: 0 0 22px;
  color: #5f6d7a;
  line-height: 1.6;
}

.checkout-popup label {
  display: block;
  margin-top: 18px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #22313f;
}

.checkout-popup input,
.checkout-popup select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #d3d8df;
  border-radius: 12px;
  background: #fff;
  font-size: 1rem;
  color: #16202b;
}

.checkout-popup select {
  appearance: none;
}

.checkout-note {
  margin-top: 10px;
  color: #586675;
  font-size: 0.95rem;
}

.checkout-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 26px;
}

.btn-secondary {
  background: #f5f7fa;
  color: #2e3a47;
}

.checkout-error {
  margin-top: 14px;
  color: #b00020;
  font-size: 0.95rem;
}

.discount-box {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid var(--line);
  background: var(--white-smoke);
}

.discount-box label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.discount-input-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.discount-input-row input {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
}

.apply-btn {
  min-width: 100px;
}

.discount-error {
  color: #b00020;
  font-size: 0.95rem;
}

.discount-description {
  color: #117a65;
  font-size: 0.95rem;
}

.discount-amount,
.discount-amount-summary {
  color: #0b5345;
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 4px;
}

.cart-final-total {
  font-size: 1.1rem;
  font-weight: 700;
}

.btn {
  padding: 10px 20px;
  background: var(--checkout-blue);
  color: var(--white);
  border: none;
  cursor: pointer;
  margin: 5px;
}

.btn-primary {
  background: var(--checkout-green);
}
</style>
