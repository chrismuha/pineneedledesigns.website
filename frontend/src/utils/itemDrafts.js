const DATABASE_NAME = 'pine-needle-dashboard'
const STORE_NAME = 'item-drafts'
const DATABASE_VERSION = 1

const openDraftDatabase = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const runDraftRequest = async (mode, operation) => {
  const database = await openDraftDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode)
      const request = operation(transaction.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally {
    database.close()
  }
}

export const listItemDrafts = async () => {
  const drafts = await runDraftRequest('readonly', (store) => store.getAll())
  return drafts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export const saveItemDraft = (draft) => runDraftRequest('readwrite', (store) => store.put(draft))

export const deleteItemDraft = (id) => runDraftRequest('readwrite', (store) => store.delete(id))
