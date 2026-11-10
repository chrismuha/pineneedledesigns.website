<script setup>
import { computed, ref } from 'vue'
const props = defineProps({ quantity: { type: [Number, String], default: 0 } })
const sold = computed(() => Number(props.quantity) === 0)
const dialog = ref(null)
const openInfo = () => dialog.value?.showModal()
</script>

<template>
  <div class="stock-status">
    <div class="stock-status__control">
      <input type="checkbox" :checked="sold" disabled aria-hidden="true" tabindex="-1">
      <span class="stock-status__label">Out of Stock / Sold</span>
      <button type="button" class="stock-status__explain" aria-label="Explain automatic sold status" aria-haspopup="dialog" @click="openInfo">
        <span class="stock-status__info" aria-hidden="true">i</span>
      </button>
    </div>
    <p class="stock-status__hint">Automatic: only zero quantity is marked sold. Items with stock stay available to customers.</p>
    <Teleport to="body">
      <dialog ref="dialog" class="stock-status-dialog" aria-label="Sold status follows quantity" @click="($event.target === dialog) && dialog.close()">
        <div class="stock-status-dialog__icon" aria-hidden="true"><i class="bi bi-info-circle"></i></div>
        <h2>Sold status follows quantity</h2>
        <p>With stock available, this checkbox stays unchecked so customers can still buy the item. It is marked sold automatically only when quantity reaches zero.</p>
        <p>A return or restock that raises quantity above zero makes the item available again. Update <strong>Quantity Available</strong> to change its stock status.</p>
        <form method="dialog"><button type="submit" class="btn-primary" autofocus>Got it</button></form>
      </dialog>
    </Teleport>
  </div>
</template>

<style scoped>
.stock-status { margin-block: 12px; }
.stock-status__control { position: relative; display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 4px 8px; border-radius: 8px; }
.stock-status__control input { width: 20px; height: 20px; margin: 0; opacity: .6; pointer-events: none; }
.stock-status__label { opacity: .65; font-weight: 600; }
.stock-status__explain { position: absolute; inset: 0; width: 100%; border: 0; border-radius: 8px; background: transparent; color: inherit; cursor: pointer; display: flex; align-items: center; justify-content: end; padding: 0 8px; }
.stock-status__explain:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
.stock-status__info { margin-left: 12px; display: inline-grid; place-items: center; width: 23px; height: 23px; border: 1.5px solid currentColor; border-radius: 50%; font-weight: 700; font-family: Georgia, serif; }
.stock-status__control { padding-right: 43px; }
.stock-status__hint { margin: 4px 0 0; font-size: 15px; line-height: 1.5; }
.stock-status-dialog { width: min(520px, calc(100vw - 32px)); max-height: calc(100dvh - 48px); box-sizing: border-box; overflow-y: auto; border: 0; padding: 24px; border-radius: 14px; background: var(--dashboard-confirm-dialog-dashboard-confirm-surface); color: var(--dashboard-confirm-dialog-h2-text); box-shadow: 0 18px 55px var(--dashboard-confirm-dialog-dashboard-confirm-shadow); }
.stock-status-dialog::backdrop { background: var(--dashboard-confirm-dialog-overlay-surface); }
.stock-status-dialog h2 { margin: 0 0 12px; font-size: 24px; }
.stock-status-dialog p { font-size: 16px; line-height: 1.6; }
.stock-status-dialog__icon { font-size: 28px; margin-bottom: 12px; }
.stock-status-dialog form { display: flex; justify-content: end; margin-top: 20px; }
.stock-status-dialog button { min-height: 44px; min-width: 120px; }
</style>
