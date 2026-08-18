<template>
  <div>
    <h1 v-if="!isLoading">{{ status }}</h1>
    <h1 v-else>Loading...</h1>
    <p v-if="!isLoading && message">{{ message }}</p>
  </div>
</template>

<script setup>
import { shallowRef } from 'vue';
import { useCartStore } from '../stores/cart';

const params = new URLSearchParams(window.location.search);
const cartStore = useCartStore();
const token = params.get('token');
const sessionId = params.get('session_id');
const isLoading = shallowRef(true);
const status = shallowRef('');
const message = shallowRef('');

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

const confirmCloverOrder = async () => {
  let attempts = 0;
  while (attempts < 8) {
    const response = await fetch(`/api/payments/clover/confirm/${encodeURIComponent(sessionId)}`, {
      credentials: 'include',
    });
    const data = await response.json();

    if (response.ok && data.success && data.status === 'paid') {
      status.value = 'Order completed successfully';
      message.value = `Thank you for your order${data.orderNumber ? ` #${data.orderNumber}` : ''}.`;
      await cartStore.clearCart();
      return;
    }

    if (data.code === 'PAYMENT_FAILED' || data.status === 'failed') {
      throw new Error(data.message || 'Payment was not completed.');
    }

    attempts += 1;
    await wait(1500);
  }

  throw new Error('Your payment is still being confirmed. If you were charged, please contact support.');
};

const completeOrder = async () => {
  try {
    if (sessionId) {
      await confirmCloverOrder();
      return;
    }

    if (token) {
      const response = await fetch(`/api/checkout/capture-order/${token}`);
      if (!response.ok) {
        throw new Error('Unable to confirm legacy PayPal order.');
      }
      status.value = 'Order completed successfully';
      message.value = 'Your order has been confirmed.';
      await cartStore.clearCart();
      return;
    }

    status.value = 'Order status unavailable';
    message.value = 'We could not verify your order. If you completed payment, please contact support.';
  } catch (error) {
    status.value = 'Error while ordering';
    message.value = error.message || 'There was an issue confirming your order. If you were charged, please contact support.';
  } finally {
    isLoading.value = false;
  }
};

completeOrder();
</script>
