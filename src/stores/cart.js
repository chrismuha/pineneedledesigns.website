import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = 'http://localhost:3001/api'

const DISCOUNT_CODES = {
  'B$': { type: 'fixed', value: 20, label: '$20 off' },
  'W$': { type: 'fixed', value: 25, label: '$25 off' },
  'FAM': { type: 'percent', value: 40, label: '40% off' },
  'SURPRISE': { type: 'percent', value: 20, label: '20% off' },
  'SEW': { type: 'percent', value: 10, label: '10% off' },
}

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const isOpen = ref(false)
  const isLoading = ref(false)
  const appliedDiscountCode = ref('')
  const discountError = ref('')

  const totalItems = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  const discountRule = (code) => {
    if (!code || typeof code !== 'string') return null
    return DISCOUNT_CODES[code.trim().toUpperCase()] || null
  }

  const discountAmount = computed(() => {
    const rule = discountRule(appliedDiscountCode.value)
    if (!rule) return 0

    if (rule.type === 'fixed') {
      return Math.min(rule.value, totalPrice.value)
    }

    return Number(((totalPrice.value * rule.value) / 100).toFixed(2))
  })

  const discountedTotal = computed(() => {
    return Math.max(0, totalPrice.value - discountAmount.value)
  })

  const discountDescription = computed(() => {
    const rule = discountRule(appliedDiscountCode.value)
    if (!rule) return ''
    return `${rule.label} applied` 
  })

  const applyDiscountCode = (code) => {
    const normalized = code ? code.trim().toUpperCase() : ''
    if (!normalized) {
      appliedDiscountCode.value = ''
      discountError.value = ''
      return true
    }

    const rule = discountRule(normalized)
    if (!rule) {
      appliedDiscountCode.value = ''
      discountError.value = 'Invalid discount code.'
      return false
    }

    appliedDiscountCode.value = normalized
    discountError.value = ''
    return true
  }

  const clearDiscount = () => {
    appliedDiscountCode.value = ''
    discountError.value = ''
  }

  const fetchCart = async () => {
    try {
      isLoading.value = true
      const response = await fetch(`/api/cart`, {
        credentials: 'include'
      })
      if (response.ok) {
        items.value = await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      isLoading.value = false
    }
  }

  const addItem = async (product) => {
    try {
      isLoading.value = true
      const response = await fetch(`/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ product })
      })

      if (response.ok) {
        items.value = await response.json()
        isOpen.value = true // Auto open cart when item is added
      }
    } catch (error) {
      console.error('Failed to add item:', error)
    } finally {
      isLoading.value = false
    }
  }

  const removeItem = async (productId) => {
    try {
      isLoading.value = true
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        items.value = await response.json()
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      isLoading.value = false
    }
  }

  const updateQuantity = async (productId, quantity) => {
    try {
      isLoading.value = true
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ quantity })
      })

      if (response.ok) {
        items.value = await response.json()
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      isLoading.value = false
    }
  }

  const clearCart = async () => {
    try {
      isLoading.value = true
      const response = await fetch(`/api/cart`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        items.value = await response.json()
      }
    } catch (error) {
      console.error('Failed to clear cart:', error)
    } finally {
      isLoading.value = false
    }
  }

  const toggleOpen = () => {
    isOpen.value = !isOpen.value
  }

  const close = () => {
    isOpen.value = false
  }

  // Initialize cart on store creation
  fetchCart();

  return {
    items,
    isOpen,
    isLoading,
    totalItems,
    totalPrice,
    discountAmount,
    discountedTotal,
    discountDescription,
    appliedDiscountCode,
    discountError,
    applyDiscountCode,
    clearDiscount,
    fetchCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleOpen,
    close,
    API_BASE
  }
})