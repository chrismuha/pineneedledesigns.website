<script setup>
import { onMounted, ref } from 'vue'
import { deleteItemDraft, listItemDrafts } from '../../utils/itemDrafts.js'
import { showDashboardToast } from '../../utils/dashboardToast.js'
import DashboardConfirmDialog from './DashboardConfirmDialog.vue'

const drafts = ref([])
const loading = ref(true)
const deletingId = ref('')
const draftPendingDelete = ref(null)
const deleteConfirmationStep = ref(0)

const loadDrafts = async () => {
  loading.value = true
  try {
    drafts.value = await listItemDrafts()
  } finally {
    loading.value = false
  }
}

const draftDestination = (draft) => draft.kind === 'edit'
  ? { path: '/dashboard/items', query: { item: draft.productId } }
  : { path: '/dashboard/create', query: { draft: draft.id } }

const draftType = (draft) => draft.kind === 'edit' ? 'Item edit' : 'New item'

const requestDraftDeletion = (draft) => {
  draftPendingDelete.value = draft
  deleteConfirmationStep.value = 1
}

const continueDraftDeletion = () => {
  deleteConfirmationStep.value = 2
}

const cancelDraftDeletion = () => {
  draftPendingDelete.value = null
  deleteConfirmationStep.value = 0
}

const handleDraftDeletionCancel = () => {
  if (deleteConfirmationStep.value === 2) {
    deleteConfirmationStep.value = 1
    return
  }
  cancelDraftDeletion()
}

const handleDraftDeletionConfirm = () => {
  if (deleteConfirmationStep.value === 1) {
    continueDraftDeletion()
    return
  }
  void removeDraft()
}

const removeDraft = async () => {
  const draft = draftPendingDelete.value
  if (!draft) return
  deletingId.value = draft.id
  try {
    await deleteItemDraft(draft.id)
    await loadDrafts()
    showDashboardToast(`Deleted “${draft.name}” from this browser.`, {
      type: 'success',
      title: 'Draft deleted',
    })
    cancelDraftDeletion()
  } catch (error) {
    showDashboardToast(error?.message || 'This draft could not be deleted. Please try again.', {
      title: 'Draft not deleted',
    })
  } finally {
    deletingId.value = ''
  }
}

onMounted(loadDrafts)
</script>

<template>
  <div class="drafts-page dashboard-page">
    <div class="page-header">
      <div>
        <h1>Drafts</h1>
        <p>Item drafts saved in this browser.</p>
      </div>
      <RouterLink class="btn-primary" to="/dashboard/create">Create New Item</RouterLink>
    </div>

    <p v-if="loading" class="status-text">Loading drafts...</p>

    <section v-else class="drafts-section">
      <RouterLink v-if="!drafts.length" class="empty-drafts" to="/dashboard/create">
        No drafts yet. Start creating an item.
      </RouterLink>

      <article v-for="draft in drafts" :key="draft.id" class="draft-card">
        <div>
          <span class="draft-type">{{ draftType(draft) }}</span>
          <h2>{{ draft.name }}</h2>
          <p>Last saved {{ new Date(draft.updatedAt).toLocaleString() }}</p>
        </div>
        <div class="draft-actions">
          <RouterLink class="btn-primary" :to="draftDestination(draft)">Resume Draft</RouterLink>
          <button type="button" class="dashboard-remove-btn" :disabled="deletingId === draft.id" @click="requestDraftDeletion(draft)">
            {{ deletingId === draft.id ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </article>
    </section>

    <DashboardConfirmDialog
      :open="Boolean(draftPendingDelete)"
      :step-label="`Confirmation ${deleteConfirmationStep} of 2`"
      :title="deleteConfirmationStep === 1 ? `Delete “${draftPendingDelete?.name || 'this draft'}”?` : 'Permanently delete this draft?'"
      :message="deleteConfirmationStep === 1 ? 'This draft and its locally saved media will be removed from this browser.' : 'This cannot be undone.'"
      :confirm-label="deleteConfirmationStep === 1 ? 'Continue' : 'Delete Draft'"
      :cancel-label="deleteConfirmationStep === 1 ? 'Keep Draft' : 'Go Back'"
      :busy="Boolean(deletingId)"
      @confirm="handleDraftDeletionConfirm"
      @cancel="handleDraftDeletionCancel"
    />
  </div>
</template>

<style src="../../styles/dashboard.css"></style>

<style scoped>
.page-header p { margin: 6px 0 0; color: #66736a; }
.drafts-section { display: grid; gap: 14px; }
.draft-card { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px; border: 1px solid #d8eadb; border-radius: 14px; background: #fff; }
.draft-card h2 { margin: 5px 0; color: #203326; font-size: 1.2rem; }
.draft-card p { margin: 0; color: #68766c; font-size: .88rem; }
.draft-type { color: var(--dashboard-green); font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.draft-actions { display: flex; flex: none; gap: 10px; }
.draft-actions a { display: inline-flex; align-items: center; text-decoration: none; }
.empty-drafts { padding: 28px; border: 1px dashed #bcd6c3; border-radius: 14px; background: #f8fbf9; color: #24783d; text-align: center; text-decoration: none; }
@media (max-width: 650px) {
  .draft-card { align-items: stretch; flex-direction: column; }
  .draft-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .draft-actions > * { justify-content: center; width: 100%; min-height: 46px; }
}
</style>
