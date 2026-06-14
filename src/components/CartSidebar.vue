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
          <p class="popup-subtitle">Please enter your contact, billing, and shipping details before proceeding to payment.</p>

          <label for="customer-email">Email</label>
          <input id="customer-email" type="email" v-model="customerEmail" placeholder="Email address" />

          <label for="customer-phone">Phone</label>
          <input id="customer-phone" type="tel" v-model="customerPhone" placeholder="Phone number" />

          <label for="customer-type">Are you purchasing as:</label>
          <select id="customer-type" v-model="customerType">
            <option value="Individual">Individual</option>
            <option value="Business / Organization">Business / Organization</option>
          </select>

          <div class="checkout-grid">
            <div>
              <h4>Billing address</h4>

              <label for="billing-name">Full name</label>
              <input id="billing-name" type="text" v-model="billingName" placeholder="Full name" />

              <label for="billing-address-1">Street address line 1</label>
              <input id="billing-address-1" type="text" v-model="billingAddress1" placeholder="Street address line 1" />

              <label for="billing-address-2">Street address line 2 (optional)</label>
              <input id="billing-address-2" type="text" v-model="billingAddress2" placeholder="Street address line 2" />

              <label for="billing-city">City</label>
              <input id="billing-city" type="text" v-model="billingCity" placeholder="City" />

              <label for="billing-state">State</label>
              <select id="billing-state" v-model="billingState">
                <option disabled value="">Select state</option>
                <option v-for="state in US_STATES" :key="state" :value="state">{{ state }}</option>
              </select>

              <label for="billing-zip">ZIP code</label>
              <input id="billing-zip" type="text" v-model="billingZip" placeholder="ZIP code" />

              <label class="checkbox-label">
                <input type="checkbox" v-model="sameAsBilling" />
                My shipping address is same as my billing address.
              </label>
            </div>

            <div v-if="!sameAsBilling">
              <h4>Shipping address</h4>

              <label for="shipping-name">Full name</label>
              <input id="shipping-name" type="text" v-model="shippingName" placeholder="Shipping full name" />

              <label for="shipping-address-1">Street address line 1</label>
              <input id="shipping-address-1" type="text" v-model="shippingAddress1" placeholder="Street address line 1" />

              <label for="shipping-address-2">Street address line 2 (optional)</label>
              <input id="shipping-address-2" type="text" v-model="shippingAddress2" placeholder="Street address line 2" />

              <label for="shipping-city">City</label>
              <input id="shipping-city" type="text" v-model="shippingCity" placeholder="City" />

              <label for="shipping-state">State</label>
              <select id="shipping-state" v-model="shippingState">
                <option disabled value="">Select state</option>
                <option v-for="state in US_STATES" :key="state" :value="state">{{ state }}</option>
              </select>

              <label for="shipping-zip">ZIP code</label>
              <input id="shipping-zip" type="text" v-model="shippingZip" placeholder="ZIP code" />
            </div>
          </div>

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
import { ref, watch, onUnmounted } from 'vue'
import { useCartStore } from '../stores/cart'

const cartStore = useCartStore()
const codeInput = ref('')
const showCheckoutForm = ref(false)
const customerType = ref('Individual')
const customerEmail = ref('')
const customerPhone = ref('')
const billingName = ref('')
const billingAddress1 = ref('')
const billingAddress2 = ref('')
const billingCity = ref('')
const billingState = ref('')
const billingZip = ref('')
const sameAsBilling = ref(true)
const shippingName = ref('')
const shippingAddress1 = ref('')
const shippingAddress2 = ref('')
const shippingCity = ref('')
const shippingState = ref('')
const shippingZip = ref('')
const checkoutError = ref('')

// Prevent background scrolling when modal is open
watch(showCheckoutForm, (open) => {
  try {
    if (open) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  } catch (e) {
    // SSR or test environments may not have document
  }
})

onUnmounted(() => {
  try {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
  } catch (e) {}
})

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
]

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

  if (!customerEmail.value.trim() || !customerPhone.value.trim()) {
    checkoutError.value = 'Please provide your email and phone number.'
    return
  }

  if (!billingName.value.trim() || !billingAddress1.value.trim() || !billingCity.value.trim() || !billingState.value || !billingZip.value.trim()) {
    checkoutError.value = 'Please complete your billing address.'
    return
  }

  if (!sameAsBilling.value) {
    if (!shippingName.value.trim() || !shippingAddress1.value.trim() || !shippingCity.value.trim() || !shippingState.value || !shippingZip.value.trim()) {
      checkoutError.value = 'Please complete your shipping address.'
      return
    }
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
        type: customerType.value,
        email: customerEmail.value.trim(),
        phone: customerPhone.value.trim(),
      },
      billingAddress: {
        name: billingName.value.trim(),
        address1: billingAddress1.value.trim(),
        address2: billingAddress2.value.trim(),
        city: billingCity.value.trim(),
        state: billingState.value,
        zip: billingZip.value.trim(),
      },
      shippingAddress: sameAsBilling.value ? {
        name: billingName.value.trim(),
        address1: billingAddress1.value.trim(),
        address2: billingAddress2.value.trim(),
        city: billingCity.value.trim(),
        state: billingState.value,
        zip: billingZip.value.trim(),
      } : {
        name: shippingName.value.trim(),
        address1: shippingAddress1.value.trim(),
        address2: shippingAddress2.value.trim(),
        city: shippingCity.value.trim(),
        state: shippingState.value,
        zip: shippingZip.value.trim(),
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

/* @media (max-width: 720px) {
  .cart-items .item-row {
    flex-direction: column;
    gap: 12px;
  }

  .cart-items .item-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
} */


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
  width: min(920px, 100%);
  max-width: 920px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.95);
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
  margin: 0 0 10px;
  font-size: 1.3rem;
}

.popup-subtitle {
  margin: 0 0 18px;
  color: #5f6d7a;
  line-height: 1.5;
  font-size: 0.95rem;
}

.checkout-popup label {
  display: block;
  margin-top: 14px;
  margin-bottom: 6px;
  font-weight: 600;
  color: #22313f;
  font-size: 0.92rem;
}

.checkout-popup input,
.checkout-popup select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d3d8df;
  border-radius: 10px;
  background: #fff;
  font-size: 0.95rem;
  color: #16202b;
}

.checkout-popup .checkout-grid {
  display: flex;
  gap: 18px;
  margin-top: 20px;
}
.checkout-grid > * {
  flex: 1;
  max-width: calc(50% - 18px);
}

@media (max-width: 800px) {
  .checkout-popup {
    width: min(100%, 100%);
    margin: 0 10px;
    max-width: 100%;
    padding: 18px;
  }

  .checkout-popup h3 {
    font-size: 1.2rem;
  }

  .checkout-popup .checkout-grid {
    flex-direction: column;
    gap: 14px;
  }

  .checkout-grid > * {
    max-width: 100%;
  }

  /* Ensure header and checkbox stack on small screens */
  .checkout-popup .shipping-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .checkout-popup .shipping-header-row .checkbox-label {
    margin-top: 0;
    align-self: stretch;
  }

  .checkout-popup input,
  .checkout-popup select {
    padding: 10px 12px;
  }
}

.checkout-popup h4 {
  margin: 20px 0 10px;
  font-size: 1rem;
}

.checkout-popup select {
  appearance: none;
}

.checkout-note {
  margin-top: 10px;
  color: #586675;
  font-size: 0.9rem;
}

.checkout-popup .checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  font-size: 0.95rem;
  color: #22313f;
  cursor: pointer;
}

.checkout-popup .checkbox-label input {
  margin: 0;
  width: 16px;
  height: 16px;
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
