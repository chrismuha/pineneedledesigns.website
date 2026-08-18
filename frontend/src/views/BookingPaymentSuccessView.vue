<template>
  <section class="booking-success-page">
    <div class="booking-success-card">
      <template v-if="loading">
        <h1>Confirming your deposit…</h1>
        <p>Please keep this page open while your payment is confirmed.</p>
      </template>

      <template v-else-if="error">
        <h1>We couldn’t confirm your deposit</h1>
        <p class="error" role="alert">{{ error }}</p>
        <router-link to="/">Return home</router-link>
      </template>

      <template v-else>
        <p class="success-mark" aria-hidden="true">✓</p>
        <h1>Deposit received!</h1>
        <p>Your ${{ result.amount }} deposit is confirmed. Now choose your appointment time to finish booking.</p>
        <a class="calendar-button" :href="result.bookingUrl">Choose Appointment Time</a>
        <p class="important">Your appointment is not reserved until you complete the calendar booking.</p>
      </template>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'

const loading = ref(true)
const error = ref('')
const result = reactive({ amount: '', bookingUrl: '' })

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); })

const confirmDeposit = async (sessionId) => {
  let attempts = 0
  while (attempts < 8) {
    const response = await fetch(`/api/booking-deposit/confirm/${encodeURIComponent(sessionId)}`)
    const data = await response.json().catch(() => ({}))

    if (response.ok && data.success) {
      result.amount = data.amount
      result.bookingUrl = data.bookingUrl
      return
    }

    if (data.code !== 'PAYMENT_PENDING' && response.status !== 202) {
      throw new Error(data.error || data.message || 'We cannot confirm your deposit right now.')
    }

    attempts += 1
    await wait(1500)
  }

  throw new Error('Your deposit is still being confirmed. If you were charged, please contact Pine Needle Designs for help.')
}

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const sessionId = params.get('session_id')
  const legacyToken = params.get('token')

  if (legacyToken && !sessionId) {
    error.value = 'This confirmation link uses a legacy payment format. If you paid recently, please contact Pine Needle Designs for help.'
    loading.value = false
    return
  }

  if (!sessionId) {
    error.value = 'This confirmation link is incomplete. If you paid, please check your receipt and contact Pine Needle Designs for help.'
    loading.value = false
    return
  }

  try {
    await confirmDeposit(sessionId)
  } catch (err) {
    error.value = err.message || 'We cannot confirm your deposit right now. Please do not submit another payment. Check your receipt, then contact Pine Needle Designs for help.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.booking-success-page { min-height: 65vh; display: grid; place-items: center; padding: 56px 18px; }
.booking-success-card { width: min(100%, 600px); padding: clamp(28px, 5vw, 48px); border-radius: 24px; background: var(--booking-payment-success-view-booking-success-card-surface); box-shadow: 0 18px 50px var(--booking-payment-success-view-booking-success-card-shadow); text-align: center; }
.success-mark { display: grid; place-items: center; width: 58px; height: 58px; margin: 0 auto 16px; border-radius: 50%; background: var(--booking-payment-success-view-success-mark-surface); color: var(--booking-payment-success-view-success-mark-text); font-size: 24pt; font-weight: 800; }
.calendar-button { display: inline-flex; min-height: 50px; margin: 18px 0 8px; padding: 12px 26px; align-items: center; border-radius: 999px; background: var(--booking-payment-success-view-calendar-button-surface); color: var(--booking-payment-success-view-calendar-button-text); font-weight: 800; text-decoration: none; }
.important { color: var(--booking-payment-success-view-important-text); font-size: 10.8pt; }
.error { color: var(--booking-payment-success-view-error-text); font-weight: 700; }
</style>
