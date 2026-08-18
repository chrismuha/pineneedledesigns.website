<template>
  <div>
    <h1>Payment not completed</h1>
    <p>{{ message }}</p>
    <p>You can return to the store and try checkout again. Your cart has been preserved.</p>
  </div>
</template>

<script setup>
import { shallowRef } from 'vue';

const params = new URLSearchParams(window.location.search);
const message = shallowRef('Your Clover payment could not be completed.');
const sessionId = params.get('session_id');

if (sessionId) {
  fetch(`/api/payments/clover/confirm/${encodeURIComponent(sessionId)}`, { credentials: 'include' })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) message.value = data.message;
    })
    .catch(() => {});
}
</script>
