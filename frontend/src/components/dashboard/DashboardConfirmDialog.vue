<script setup>
defineProps({
  open: { type: Boolean, default: false }, title: { type: String, required: true },
  message: { type: String, required: true }, confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' }, stepLabel: { type: String, default: '' },
  busy: { type: Boolean, default: false },
})
defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="dashboard-confirm-overlay">
      <section :key="stepLabel || title" class="dashboard-confirm" role="alertdialog" aria-modal="true" :aria-label="title">
        <div class="dashboard-confirm__icon" aria-hidden="true"><i class="bi bi-exclamation-triangle"></i></div>
        <p v-if="stepLabel" class="dashboard-confirm__step">{{ stepLabel }}</p>
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        <div class="dashboard-confirm__actions">
          <button type="button" class="btn-outline" :disabled="busy" @click="$emit('cancel')">{{ cancelLabel }}</button>
          <button type="button" class="btn-danger" :disabled="busy" @click="$emit('confirm')">{{ busy ? 'Working…' : confirmLabel }}</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.dashboard-confirm-overlay { position: fixed; inset: 0; z-index: 5000; display: grid; place-items: center; padding: 16px; background: var(--dashboard-confirm-dialog-overlay-surface); }
.dashboard-confirm { width: min(100%, 520px); box-sizing: border-box; padding: 24px; border-radius: 14px; background: var(--dashboard-confirm-dialog-dashboard-confirm-surface); text-align: center; box-shadow: 0 18px 55px var(--dashboard-confirm-dialog-dashboard-confirm-shadow); }
.dashboard-confirm__icon { display: grid; width: 58px; height: 58px; margin: 0 auto 12px; place-items: center; border-radius: 50%; background: var(--dashboard-destructive-action-soft-surface); color: var(--dashboard-destructive-action-color); font-size: 20.4pt; }
.dashboard-confirm__step { margin: 0 0 6px; color: var(--dashboard-confirm-dialog-dashboard-confirm-step-text); font-size: 10.2pt; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
h2 { margin: 0 0 12px; color: var(--dashboard-confirm-dialog-h2-text); }
p { line-height: 1.55; }
.dashboard-confirm__actions { display: flex; justify-content: center; gap: 12px; margin-top: 22px; }
.dashboard-confirm__actions button { min-width: 150px; }
@media (max-width: 600px) {
  .dashboard-confirm-overlay { align-items: end; padding: 12px 12px calc(12px + env(safe-area-inset-bottom)); }
  .dashboard-confirm { padding: 22px 16px; border-radius: 14px; }
  .dashboard-confirm__actions { flex-direction: column-reverse; }
  .dashboard-confirm__actions button { width: 100%; min-width: 0; min-height: 48px; }
}
</style>
