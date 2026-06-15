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
        <div v-if="cartStore.items.length" class="cart-items-list">
          <div v-for="item in cartStore.items" :key="item.id" class="cart-item">
            <div class="item-row">
              <div class="item-image-wrap">
                <img :src="itemImage(item)" alt="Cart item" class="item-image" />
              </div>
              <div class="item-main">
                <h3>{{ item.title || item.name || 'Item' }}</h3>
                <div class="item-price">${{ item.price.toFixed(2) }}</div>
                <div class="item-total">
                  <span class="item-total-label">Total</span>
                  <strong class="item-total-value">${{ (item.price * item.quantity).toFixed(2) }}</strong>
                </div>
                <div class="item-actions">
                  <div class="item-controls">
                    <button class="qty-btn" type="button" @click="updateQuantity(item.id, Math.max(1, item.quantity - 1))">-</button>
                    <span class="quantity">{{ item.quantity }}</span>
                    <button class="qty-btn" type="button" @click="updateQuantity(item.id, item.quantity + 1)">+</button>
                  </div>
                  <button class="remove-button" type="button" @click="removeItem(item.id)" aria-label="Remove item">×</button>
                </div>
              </div>
            </div>
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
          <div class="checkout-popup-body">
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
              <div class="dropdown-field" @click.stop>
                <input
                  id="billing-state"
                  type="text"
                  v-model="billingStateQuery"
                  @focus="billingStateOpen = true"
                  @input="billingStateOpen = true"
                  @blur="onBillingStateBlur"
                  placeholder="Search and select state"
                  autocomplete="off"
                />
                <button type="button" class="dropdown-toggle" @click="billingStateOpen = !billingStateOpen">▾</button>
                <ul v-if="billingStateOpen" class="dropdown-list">
                  <li v-for="state in filteredStates" :key="state" @mousedown.prevent="selectBillingState(state)">{{ state }}</li>
                </ul>
              </div>
              <p v-if="billingStateInvalid" class="field-error">Invalid state</p>

              <label for="billing-county">County</label>
              <div class="dropdown-field" @click.stop>
                <input
                  id="billing-county"
                  type="text"
                  v-model="billingCountyQuery"
                  @focus="billingCountyOpen = billingState !== ''"
                  @input="billingCountyOpen = billingState !== ''"
                  @blur="onBillingCountyBlur"
                  placeholder="Search and select county"
                  :disabled="!billingState"
                  autocomplete="off"
                />
                <button type="button" class="dropdown-toggle" @click="billingCountyOpen = billingState !== '' ? !billingCountyOpen : false">▾</button>
                <ul v-if="billingCountyOpen" class="dropdown-list">
                  <li v-for="county in filteredBillingCounties" :key="county" @mousedown.prevent="selectBillingCounty(county)">{{ county }}</li>
                </ul>
              </div>
              <p v-if="!billingState" class="field-note">Please select a state first.</p>

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
              <div class="dropdown-field" @click.stop>
                <input
                  id="shipping-state"
                  type="text"
                  v-model="shippingStateQuery"
                  @focus="shippingStateOpen = true"
                  @input="shippingStateOpen = true"
                  @blur="onShippingStateBlur"
                  placeholder="Search and select state"
                  autocomplete="off"
                />
                <button type="button" class="dropdown-toggle" @click="shippingStateOpen = !shippingStateOpen">▾</button>
                <ul v-if="shippingStateOpen" class="dropdown-list">
                  <li v-for="state in filteredShippingStates" :key="state" @mousedown.prevent="selectShippingState(state)">{{ state }}</li>
                </ul>
              </div>
              <p v-if="shippingStateInvalid" class="field-error">Invalid state</p>

              <label for="shipping-county">County</label>
              <div class="dropdown-field" @click.stop>
                <input
                  id="shipping-county"
                  type="text"
                  v-model="shippingCountyQuery"
                  @focus="shippingCountyOpen = shippingState !== ''"
                  @input="shippingCountyOpen = shippingState !== ''"
                  @blur="onShippingCountyBlur"
                  placeholder="Search and select county"
                  :disabled="!shippingState"
                  autocomplete="off"
                />
                <button type="button" class="dropdown-toggle" @click="shippingCountyOpen = shippingState !== '' ? !shippingCountyOpen : false">▾</button>
                <ul v-if="shippingCountyOpen" class="dropdown-list">
                  <li v-for="county in filteredShippingCounties" :key="county" @mousedown.prevent="selectShippingCounty(county)">{{ county }}</li>
                </ul>
              </div>
              <p v-if="!shippingState" class="field-note">Please select a state first.</p>

              <label for="shipping-zip">ZIP code</label>
              <input id="shipping-zip" type="text" v-model="shippingZip" placeholder="ZIP code" />
            </div>
          </div>

          <div class="item-breakdown">
            <h4>Order details</h4>
            <div class="item-breakdown-table-wrapper">
              <table class="item-breakdown-table">
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
                  <tr v-for="line in itemizedLineItems" :key="line.id">
                    <td>{{ line.title }}</td>
                    <td>{{ line.quantity }}</td>
                    <td>${{ line.subtotal.toFixed(2) }}</td>
                    <td>
                      <span>{{ line.discountPercentDisplay }}</span>
                      <span class="item-detail-secondary">(${{ line.discountAmount.toFixed(2) }})</span>
                    </td>
                    <td>
                      <span>{{ line.taxRateDisplay }}</span>
                      <span class="item-detail-secondary">(${{ line.taxAmount.toFixed(2) }})</span>
                    </td>
                    <td>${{ line.lineTotal.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="checkout-summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${{ cartStore.totalPrice.toFixed(2) }}</span>
            </div>
            <div v-if="cartStore.discountAmount > 0" class="summary-row">
              <span>Discount</span>
              <span class="summary-discount">- ${{ cartStore.discountAmount.toFixed(2) }}</span>
            </div>
            <div v-if="cartStore.discountAmount > 0" class="summary-row">
              <span>Total without tax</span>
              <span>${{ cartStore.discountedTotal.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>Tax {{ canCalculateTax ? `(${shippingTaxRatePercent})` : '' }}</span>
              <span v-if="canCalculateTax">+ ${{ totalTax.toFixed(2) }}</span>
              <span v-else>Waiting for customer information</span>
            </div>
            <div class="summary-row summary-total">
              <span>Final total</span>
              <span>${{ finalTotalWithTax.toFixed(2) }}</span>
            </div>
          </div>

          <p class="checkout-note">These information are necessary for us to process your order.</p>
          <p v-if="checkoutError" class="checkout-error">{{ checkoutError }}</p>

          <div class="checkout-actions">
            <button type="button" class="btn btn-secondary" @click="showCheckoutForm = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="submitCheckout">Proceed to payment</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, watch, onUnmounted, onMounted, computed } from 'vue'
import { useCartStore } from '../stores/cart'
import countiesData from '../data/counties.json'

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
const billingStateQuery = ref('')
const billingStateInvalid = ref(false)
const billingCounty = ref('')
const billingCountyQuery = ref('')
const billingZip = ref('')
const billingStateOpen = ref(false)
const billingCountyOpen = ref(false)
const sameAsBilling = ref(true)
const shippingName = ref('')
const shippingAddress1 = ref('')
const shippingAddress2 = ref('')
const shippingCity = ref('')
const shippingState = ref('')
const shippingStateQuery = ref('')
const shippingStateInvalid = ref(false)
const shippingCounty = ref('')
const shippingCountyQuery = ref('')
const shippingZip = ref('')
const shippingStateOpen = ref(false)
const shippingCountyOpen = ref(false)
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

const uniqueStates = [...new Set(countiesData.map(item => item.state))].sort()
const filteredStates = computed(() => {
  const query = billingStateQuery.value.trim().toLowerCase()
  return query
    ? uniqueStates.filter(state => state.toLowerCase().includes(query))
    : uniqueStates
})
const filteredShippingStates = computed(() => {
  const query = shippingStateQuery.value.trim().toLowerCase()
  return query
    ? uniqueStates.filter(state => state.toLowerCase().includes(query))
    : uniqueStates
})
const billingCountyOptions = computed(() => {
  return billingState.value ? countiesData.filter(item => item.state === billingState.value).map(item => item.county) : []
})
const effectiveShippingState = computed(() => sameAsBilling.value ? billingState.value : shippingState.value)
const effectiveShippingCounty = computed(() => sameAsBilling.value ? billingCounty.value : shippingCounty.value)

const shippingCountyOptions = computed(() => {
  return effectiveShippingState.value ? countiesData.filter(item => item.state === effectiveShippingState.value).map(item => item.county) : []
})
const filteredBillingCounties = computed(() => {
  const query = billingCountyQuery.value.trim().toLowerCase()
  return query
    ? billingCountyOptions.value.filter(county => county.toLowerCase().includes(query))
    : billingCountyOptions.value
})
const filteredShippingCounties = computed(() => {
  const query = shippingCountyQuery.value.trim().toLowerCase()
  return query
    ? shippingCountyOptions.value.filter(county => county.toLowerCase().includes(query))
    : shippingCountyOptions.value
})

const shippingTaxRate = computed(() => {
  if (!effectiveShippingState.value || !effectiveShippingCounty.value) return 0
  const county = countiesData.find(item => item.state === effectiveShippingState.value && item.county === effectiveShippingCounty.value)
  return county?.combinedTaxRateStatewideAvg ?? 0
})

const shippingTaxRatePercent = computed(() => {
  const rate = shippingTaxRate.value * 100
  return `${rate.toFixed(4).replace(/\.?0+$/, '')}%`
})

const canCalculateTax = computed(() => {
  return effectiveShippingState.value && effectiveShippingCounty.value && shippingTaxRate.value > 0
})

const totalTax = computed(() => {
  const total = cartStore.totalPrice
  if (!total || !canCalculateTax.value) return 0
  return cartStore.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity
    const itemDiscount = total > 0 ? (itemTotal / total) * cartStore.discountAmount : 0
    const itemAfterDiscount = Math.max(0, itemTotal - itemDiscount)
    return sum + itemAfterDiscount * shippingTaxRate.value
  }, 0)
})

const itemizedLineItems = computed(() => {
  const total = cartStore.totalPrice
  const discountAmount = cartStore.discountAmount || 0
  return cartStore.items.map(item => {
    const itemTotal = item.price * item.quantity
    const itemDiscount = total > 0 ? (itemTotal / total) * discountAmount : 0
    const itemAfterDiscount = Math.max(0, itemTotal - itemDiscount)
    const itemTaxRate = item.taxRate ?? shippingTaxRate.value
    const itemTax = canCalculateTax.value ? itemAfterDiscount * itemTaxRate : 0
    const discountPercent = itemTotal > 0 ? itemDiscount / itemTotal : 0
    return {
      id: item.id,
      title: item.title || item.name || 'Item',
      quantity: item.quantity,
      subtotal: itemTotal,
      discountAmount: itemDiscount,
      discountPercentDisplay: discountPercent > 0
        ? `-${(discountPercent * 100).toFixed(0)}%`
        : '0%',
      taxAmount: itemTax,
      taxRateDisplay: canCalculateTax.value
        ? itemTaxRate > 0
          ? `${(itemTaxRate * 100).toFixed(2)}%`
          : '0%'
        : 'N/A',
      lineTotal: Math.max(0, itemAfterDiscount + itemTax),
    }
  })
})

const finalTotalWithTax = computed(() => {
  return Math.max(0, cartStore.discountedTotal + totalTax.value)
})

const itemImage = (item) => {
  return item.images?.[0] || item.image || item.placeholderImage || item.placeholderImages?.[0] || '/images/comingsoon/comingsoon015.webp'
}

const updateQuantity = async (id, quantity) => {
  await cartStore.updateQuantity(id, quantity)
}

const selectBillingState = (state) => {
  billingState.value = state
  billingStateQuery.value = state
  billingCounty.value = ''
  billingCountyQuery.value = ''
  billingStateOpen.value = false
  billingStateInvalid.value = false
}

const selectShippingState = (state) => {
  shippingState.value = state
  shippingStateQuery.value = state
  shippingCounty.value = ''
  shippingCountyQuery.value = ''
  shippingStateOpen.value = false
  shippingStateInvalid.value = false
}

const selectBillingCounty = (county) => {
  billingCounty.value = county
  billingCountyQuery.value = county
  billingCountyOpen.value = false
}

const selectShippingCounty = (county) => {
  shippingCounty.value = county
  shippingCountyQuery.value = county
  shippingCountyOpen.value = false
}

watch(billingState, (state) => {
  if (!state || !billingCountyOptions.value.includes(billingCounty.value)) {
    billingCounty.value = ''
    billingCountyQuery.value = ''
  }
  if (!state) {
    billingStateQuery.value = ''
  }
  billingStateInvalid.value = false
})

watch(shippingState, (state) => {
  if (!state || !shippingCountyOptions.value.includes(shippingCounty.value)) {
    shippingCounty.value = ''
    shippingCountyQuery.value = ''
  }
  if (!state) {
    shippingStateQuery.value = ''
  }
  shippingStateInvalid.value = false
})

watch(billingStateQuery, (query) => {
  const exactMatch = uniqueStates.find(state => state.toLowerCase() === query.trim().toLowerCase())
  if (exactMatch) {
    billingState.value = exactMatch
  } else if (query.trim() === '') {
    billingState.value = ''
  }
})

watch(shippingStateQuery, (query) => {
  const exactMatch = uniqueStates.find(state => state.toLowerCase() === query.trim().toLowerCase())
  if (exactMatch) {
    shippingState.value = exactMatch
  } else if (query.trim() === '') {
    shippingState.value = ''
  }
})

watch(billingCountyQuery, (query) => {
  const exactMatch = billingCountyOptions.value.find(county => county.toLowerCase() === query.trim().toLowerCase())
  if (exactMatch) {
    billingCounty.value = exactMatch
  } else if (query.trim() === '') {
    billingCounty.value = ''
  }
})

watch(shippingCountyQuery, (query) => {
  const exactMatch = shippingCountyOptions.value.find(county => county.toLowerCase() === query.trim().toLowerCase())
  if (exactMatch) {
    shippingCounty.value = exactMatch
  } else if (query.trim() === '') {
    shippingCounty.value = ''
  }
})

const onBillingStateBlur = () => {
  setTimeout(() => {
    const query = billingStateQuery.value.trim()
    const exactMatch = uniqueStates.find(state => state.toLowerCase() === query.toLowerCase())
    if (exactMatch) {
      selectBillingState(exactMatch)
      billingStateInvalid.value = false
      return
    }
    if (query) {
      billingStateInvalid.value = true
    }
    billingState.value = ''
    billingStateQuery.value = ''
    billingStateOpen.value = false
  }, 0)
}

const onBillingCountyBlur = () => {
  setTimeout(() => {
    const query = billingCountyQuery.value.trim()
    const exactMatch = billingCountyOptions.value.find(county => county.toLowerCase() === query.toLowerCase())
    if (!exactMatch) {
      billingCounty.value = ''
      billingCountyQuery.value = ''
    } else {
      billingCounty.value = exactMatch
      billingCountyQuery.value = exactMatch
    }
    billingCountyOpen.value = false
  }, 0)
}

const onShippingStateBlur = () => {
  setTimeout(() => {
    const query = shippingStateQuery.value.trim()
    const exactMatch = uniqueStates.find(state => state.toLowerCase() === query.toLowerCase())
    if (exactMatch) {
      selectShippingState(exactMatch)
      shippingStateInvalid.value = false
      return
    }
    if (query) {
      shippingStateInvalid.value = true
    }
    shippingState.value = ''
    shippingStateQuery.value = ''
    shippingStateOpen.value = false
  }, 0)
}

const onShippingCountyBlur = () => {
  setTimeout(() => {
    const query = shippingCountyQuery.value.trim()
    const exactMatch = shippingCountyOptions.value.find(county => county.toLowerCase() === query.toLowerCase())
    if (!exactMatch) {
      shippingCounty.value = ''
      shippingCountyQuery.value = ''
    } else {
      shippingCounty.value = exactMatch
      shippingCountyQuery.value = exactMatch
    }
    shippingCountyOpen.value = false
  }, 0)
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

  if (!billingName.value.trim() || !billingAddress1.value.trim() || !billingCity.value.trim() || !billingState.value || !billingCounty.value || !billingZip.value.trim()) {
    checkoutError.value = 'Please complete your billing address.'
    return
  }

  if (billingState.value && !billingCountyOptions.value.includes(billingCounty.value)) {
    checkoutError.value = 'Please select a valid billing county for the chosen state.'
    return
  }

  if (!sameAsBilling.value) {
    if (!shippingName.value.trim() || !shippingAddress1.value.trim() || !shippingCity.value.trim() || !shippingState.value || !shippingCounty.value || !shippingZip.value.trim()) {
      checkoutError.value = 'Please complete your shipping address.'
      return
    }

    if (shippingState.value && !shippingCountyOptions.value.includes(shippingCounty.value)) {
      checkoutError.value = 'Please select a valid shipping county for the chosen state.'
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
        county: billingCounty.value,
        zip: billingZip.value.trim(),
      },
      shippingAddress: sameAsBilling.value ? {
        name: billingName.value.trim(),
        address1: billingAddress1.value.trim(),
        address2: billingAddress2.value.trim(),
        city: billingCity.value.trim(),
        state: billingState.value,
        county: billingCounty.value,
        zip: billingZip.value.trim(),
      } : {
        name: shippingName.value.trim(),
        address1: shippingAddress1.value.trim(),
        address2: shippingAddress2.value.trim(),
        city: shippingCity.value.trim(),
        state: shippingState.value,
        county: shippingCounty.value,
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

.item-total {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
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
  width: 38px;
  min-width: 38px;
  padding: 0;
  font-size: 1.1rem;
}

.remove-button:hover {
  background: rgba(220, 38, 38, 0.16);
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
  background: white;
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.95);
  overflow: hidden;
}

.checkout-popup-body {
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 18px 24px 24px;
}

.popup-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #ffffff;
  color: #333;
  font-size: 24px;
  line-height: 1;
  border-radius: 12px;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
  z-index: 2;
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

.dropdown-field {
  position: relative;
}

.dropdown-field input {
  width: 100%;
  padding-right: 42px;
}

.dropdown-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  font-size: 1rem;
  cursor: pointer;
  color: #4b5563;
}

.dropdown-list {
  position: absolute;
  z-index: 10;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #d3d8df;
  border-radius: 10px;
  margin-top: 4px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  list-style: none;
  padding: 0;
}

.dropdown-list li {
  padding: 10px 12px;
  cursor: pointer;
}

.dropdown-list li:hover {
  background: #eef2ff;
}

.dropdown-field input:disabled {
  background: #f7f8fb;
  cursor: not-allowed;
}

.field-note {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 0.88rem;
}

.field-error {
  margin: 6px 0 0;
  color: #b91c1c;
  font-size: 0.88rem;
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

.item-breakdown {
  margin-top: 20px;
}

.item-breakdown h4 {
  margin: 0 0 12px;
  font-size: 1rem;
  color: #22313f;
}

.item-breakdown-table-wrapper {
  overflow-x: auto;
  border: 1px solid #d3d8df;
  border-radius: 14px;
  background: #ffffff;
}

.item-breakdown-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.item-breakdown-table th,
.item-breakdown-table td {
  padding: 12px 14px;
  text-align: left;
  font-size: 0.925rem;
  border-bottom: 1px solid #e5e7eb;
}

.item-breakdown-table th {
  background: #f8fafc;
  color: #334155;
  font-weight: 700;
}

.item-breakdown-table tr:last-child td {
  border-bottom: none;
}

.item-detail-secondary {
  display: block;
  color: #64748b;
  font-size: 0.85rem;
}

.checkout-summary {
  margin-top: 20px;
  padding: 16px 18px;
  border: 1px solid #d3d8df;
  border-radius: 14px;
  background: #f8fafc;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 0.96rem;
}

.summary-row.summary-total {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid #e5e7eb;
  font-weight: 700;
}

.summary-discount {
  color: #dc2626;
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
