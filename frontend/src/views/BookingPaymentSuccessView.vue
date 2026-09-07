<template>
  <section class="booking-success-page">
    <div class="booking-success-card">
      <template v-if="loading">
        <h1>Confirming your deposit…</h1>
        <p>Please keep this page open while your payment is confirmed.</p>
      </template>

      <template v-else-if="error">
        <h1>Deposit received — finish booking</h1>
        <p class="error" role="alert">{{ error }}</p>
        <p class="important">
          Your payment was accepted by Clover. Choose the correct calendar below to reserve your appointment time.
        </p>
        <div class="calendar-fallback">
          <a
            v-for="link in fallbackCalendars"
            :key="link.href"
            class="calendar-button"
            :href="link.href"
          >
            {{ link.label }}
          </a>
        </div>
        <router-link to="/">Return home</router-link>
      </template>

      <template v-else>
        <p class="success-mark" aria-hidden="true">✓</p>
        <h1>Deposit received!</h1>
        <p>Your ${{ result.amount }} deposit is confirmed. Opening the appointment calendar…</p>
        <a class="calendar-button" :href="result.bookingUrl">Choose Appointment Time</a>
        <p class="important">If you are not redirected automatically, tap the button above.</p>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'

const FITTING_CALENDAR = 'https://calendar.app.google/NU1nzMP69Vjz7JU4A'
const BRIDES_CALENDAR = 'https://calendar.app.google/EU8HAuemRhmr4zBY6'

const loading = ref(true)
const error = ref('')
const result = reactive({ amount: '', bookingUrl: '', service: '' })

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); })

const fallbackCalendars = computed(() => {
  if (result.service === 'fitting') {
    return [{ label: 'Open First Fitting Calendar', href: FITTING_CALENDAR }]
  }
  if (result.service === 'brides') {
    return [{ label: 'Open Bridal Calendar', href: BRIDES_CALENDAR }]
  }
  return [
    { label: 'First Fitting Calendar', href: FITTING_CALENDAR },
    { label: 'Bridal Calendar', href: BRIDES_CALENDAR },
  ]
})

const goToCalendar = (url) => {
  if (!url) return
  window.location.assign(url)
}

const confirmDeposit = async (sessionId) => {
  let attempts = 0
  while (attempts < 12) {
    const response = await fetch(`/api/booking-deposit/confirm/${encodeURIComponent(sessionId)}`)
    const data = await response.json().catch(() => ({}))

    if (response.ok && data.success && data.bookingUrl) {
      result.amount = data.amount
      result.bookingUrl = data.bookingUrl
      result.service = data.service || ''
      return data
    }

    // Even when confirmation is still pending, keep the known service/calendar.
    if (data.bookingUrl) {
      result.bookingUrl = data.bookingUrl
      result.service = data.service || result.service
      result.amount = data.amount || result.amount
    }

    if (data.code !== 'PAYMENT_PENDING' && response.status !== 202) {
      if (data.service) result.service = data.service
      if (data.bookingUrl) {
        result.bookingUrl = data.bookingUrl
        return data
      }
      throw new Error(data.error || data.message || 'We cannot confirm your deposit right now.')
    }

    attempts += 1
    await wait(1500)
  }

  if (result.bookingUrl) {
    return { success: true, bookingUrl: result.bookingUrl, amount: result.amount, service: result.service }
  }

  throw new Error('Your deposit is still being confirmed. Use the calendar link below to finish booking your appointment.')
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
    const data = await confirmDeposit(sessionId)
    loading.value = false
    if (data?.bookingUrl) {
      // Give the success message a moment, then continue to the calendar.
      await wait(900)
      goToCalendar(data.bookingUrl)
      return
    }
  } catch (err) {
    error.value = err.message || 'We cannot confirm your deposit right now. Please do not submit another payment. Check your receipt, then contact Pine Needle Designs for help.'
    loading.value = false
  }
})
</script>

<style scoped>
.booking-success-page { min-height: 65vh; display: grid; place-items: center; padding: 56px 18px; }
.booking-success-card { width: min(100%, 600px); padding: clamp(28px, 5vw, 48px); border-radius: 24px; background: var(--booking-payment-success-view-booking-success-card-surface); box-shadow: 0 18px 50px var(--booking-payment-success-view-booking-success-card-shadow); text-align: center; }
.success-mark { display: grid; place-items: center; width: 58px; height: 58px; margin: 0 auto 16px; border-radius: 50%; background: var(--booking-payment-success-view-success-mark-surface); color: var(--booking-payment-success-view-success-mark-text); font-size: 24pt; font-weight: 800; }
.calendar-button { display: inline-flex; min-height: 50px; margin: 18px 0 8px; padding: 12px 26px; align-items: center; justify-content: center; border-radius: 999px; background: var(--booking-payment-success-view-calendar-button-surface); color: var(--booking-payment-success-view-calendar-button-text); font-weight: 800; text-decoration: none; }
.important { color: var(--booking-payment-success-view-important-text); font-size: 10.8pt; }
.error { color: var(--booking-payment-success-view-error-text); font-weight: 700; }
.calendar-fallback { display: grid; gap: 10px; margin: 16px 0; }
.calendar-fallback .calendar-button { margin: 0; }
</style>
