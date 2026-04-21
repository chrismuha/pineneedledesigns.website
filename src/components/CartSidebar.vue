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
        <div v-for="item in cartStore.items" :key="item.id" class="cart-item">
          <div class="item-details">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <p>Price: ${{ item.price }}</p>
          </div>
          <div class="item-controls">
            <button @click="updateQuantity(item.id, item.quantity - 1)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="updateQuantity(item.id, item.quantity + 1)">+</button>
            <button @click="removeItem(item.id)" class="remove">Remove</button>
          </div>
          <div class="item-total">
            ${{ item.price * item.quantity }}
          </div>
        </div>
        <div class="cart-summary">
          <p>Total Items: {{ cartStore.totalItems }}</p>
          <p>Total Price: ${{ cartStore.totalPrice }}</p>
          <button @click="clearCart" class="btn">Clear Cart</button>
          <button @click="checkout" class="btn btn-primary">Checkout</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '../stores/cart'

const cartStore = useCartStore()

const updateQuantity = async (id, quantity) => {
  await cartStore.updateQuantity(id, quantity)
}

const removeItem = async (id) => {
  await cartStore.removeItem(id)
}

const clearCart = async () => {
  await cartStore.clearCart()
}

const checkout = async () => {
  const request = await fetch(`${cartStore.API_BASE}/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
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
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.cart-sidebar {
  width: 400px;
  max-width: 90vw;
  height: 100%;
  background: white;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.empty-cart {
  padding: 20px;
  text-align: center;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #666;
}

.cart-items {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
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
  border-top: 1px solid #ddd;
  text-align: center;
}

.btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  margin: 5px;
}

.btn-primary {
  background: #28a745;
}
</style>