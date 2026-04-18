import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE = 'http://localhost:4000/api'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const isOpen = ref(false)
  const isLoading = ref(false)

  const totalItems = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  const fetchCart = async () => {
    try {
      isLoading.value = true
      const response = await fetch(`${API_BASE}/cart`, {
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
      const response = await fetch(`${API_BASE}/cart`, {
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
      const response = await fetch(`${API_BASE}/cart/${productId}`, {
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
      const response = await fetch(`${API_BASE}/cart/${productId}`, {
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
      const response = await fetch(`${API_BASE}/cart`, {
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
  fetchCart()

  return {
    items,
    isOpen,
    isLoading,
    totalItems,
    totalPrice,
    fetchCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleOpen,
    close
  }
})