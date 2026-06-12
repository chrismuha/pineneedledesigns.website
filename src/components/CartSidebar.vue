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
          <div class="item-details">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <p v-for="(value, name) in item.selectedOptions" :key="name">{{ name }}: {{ value }}</p>
            <p>Price: ${{ item.price }}</p>
          </div>
          <div class="item-controls">
            <button @click="updateQuantity(item.cartItemId || item.id, item.quantity - 1)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="updateQuantity(item.cartItemId || item.id, item.quantity + 1)">+</button>
            <button @click="removeItem(item.cartItemId || item.id)" class="remove">Remove</button>
          </div>
          <div class="item-total">
            ${{ item.price * item.quantity }}
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
          <button @click="checkout" class="btn btn-primary">Checkout</button>
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

const checkout = async () => {
  const request = await fetch(`/api/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: cartStore.appliedDiscountCode })
  })

  const data = await request.json();

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
  border: 1px solid var(--line);
  padding: 10px;
  margin-bottom: 10px;
}

.item-details {
  margin-bottom: 10px;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.item-total {
  font-weight: bold;
  text-align: right;
}

.cart-summary {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  text-align: center;
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
