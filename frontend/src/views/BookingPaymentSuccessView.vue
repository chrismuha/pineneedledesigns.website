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
          If your card was charged, your deposit was taken. Choose your appointment time below so your booking is completed.
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

const DEFAULT_CALENDARS = {
  fitting: 'https://calendar.app.google/NU1nzMP69Vjz7JU4A',
  brides: 'https://calendar.app.google/EU8HAuemRhmr4zBY6',
}

const loading = ref(true)
const error = ref('')
const result = reactive({ amount: '', bookingUrl: '', service: '' })
const calendars = reactive({ ...DEFAULT_CALENDARS })

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); })

const readSessionId = () => {
  const params = new URLSearchParams(window.location.search)
  return (
    params.get('session_id')
    || params.get('checkoutSessionId')
    || params.get('checkout_session_id')
    || ''
  ).trim()
}

const rememberLocalBooking = () => {
  try {
    const service = window.sessionStorage.getItem('pine-needle-booking-service') || ''
    const calendar = window.sessionStorage.getItem('pine-needle-booking-calendar') || ''
    const amount = window.sessionStorage.getItem('pine-needle-booking-amount') || ''
    if (service) result.service = service
    if (calendar) result.bookingUrl = calendar
    if (amount) result.amount = amount
  } catch {}
}

const fallbackCalendars = computed(() => {
  if (result.service === 'fitting' || result.bookingUrl === calendars.fitting) {
    return [{ label: 'Open First Fitting Calendar', href: calendars.fitting }]
  }
  if (result.service === 'brides' || result.bookingUrl === calendars.brides) {
    return [{ label: 'Open Bridal Calendar', href: calendars.brides }]
  }
  return [
    { label: 'First Fitting Calendar', href: calendars.fitting },
    { label: 'Bridal Calendar', href: calendars.brides },
  ]
})

const goToCalendar = (url) => {
  if (!url) return
  window.location.assign(url)
}

const applyCalendars = (payload = {}) => {
  if (payload.calendars?.fitting) calendars.fitting = payload.calendars.fitting
  if (payload.calendars?.brides) calendars.brides = payload.calendars.brides
  if (payload.bookingUrl) result.bookingUrl = payload.bookingUrl
  if (payload.service) result.service = payload.service
  if (payload.amount) result.amount = payload.amount
}

const confirmDeposit = async (sessionId) => {
  let attempts = 0
  let lastError = ''

  while (attempts < 10) {
    const response = await fetch(`/api/booking-deposit/confirm/${encodeURIComponent(sessionId)}`, {
      credentials: 'include',
    })
    const data = await response.json().catch(() => ({}))
    applyCalendars(data)

    if ((response.ok && data.success && data.bookingUrl) || data.bookingUrl) {
      result.amount = data.amount || result.amount
      result.bookingUrl = data.bookingUrl
      result.service = data.service || result.service
      return {
        success: true,
        bookingUrl: data.bookingUrl,
        amount: data.amount || result.amount,
        service: data.service || result.service,
      }
    }

    lastError = data.error || data.message || 'We cannot confirm your deposit right now.'

    if (data.code !== 'PAYMENT_PENDING' && response.status !== 202) {
      if (result.bookingUrl) {
        return {
          success: true,
          bookingUrl: result.bookingUrl,
          amount: result.amount,
          service: result.service,
        }
      }
      throw new Error(lastError)
    }

    attempts += 1
    await wait(1200)
  }

  if (result.bookingUrl) {
    return {
      success: true,
      bookingUrl: result.bookingUrl,
      amount: result.amount,
      service: result.service,
    }
  }

  throw new Error(lastError || 'Your deposit is still being confirmed. Use the calendar link below to finish booking your appointment.')
}

onMounted(async () => {
  rememberLocalBooking()

  try {
    const configResponse = await fetch('/api/booking-deposit/config', { credentials: 'include' })
    const config = await configResponse.json().catch(() => ({}))
    applyCalendars(config)
  } catch {}

  const params = new URLSearchParams(window.location.search)
  const sessionId = readSessionId()
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
      await wait(700)
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
