import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = await readFile(new URL('../frontend/src/components/dashboard/DashboardItemCreation.vue', import.meta.url), 'utf8')

function editor(saveItemDraft) {
  let leave
  const toasts = []
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  const context = vm.createContext({
    computed: (fn) => ({ get value() { return fn() } }),
    ref: (value) => ({ value }), reactive: (value) => value, toRaw: (value) => value,
    watch() {}, onMounted() {}, onBeforeUnmount() {},
    onBeforeRouteLeave: (fn) => { leave = fn },
    useCatalogStore: () => ({}), useRouter: () => ({}), useRoute: () => ({ query: {} }),
    useSubcollections: () => ({ subcollections: { value: [] }, loadSubcollections() {} }),
    window: { clearTimeout() {} }, document: {},
    setDashboardActivity() {}, showDashboardToast: (...args) => toasts.push(args), saveItemDraft,
  })
  vm.runInContext(`${script}\nglobalThis.editor = { form, photoFiles, videoFiles, persistDraft, loading, draftStatus, draftSaveError, confirmPageLeave, published: () => { suppressAutoSave = true } }`, context)
  return { ...context.editor, leave: () => leave(), toasts }
}

const tick = () => new Promise((resolve) => setImmediate(resolve))

test('leaving Create Item waits for the latest description and media draft to commit', async () => {
  let complete
  const writes = []
  const app = editor((draft) => { writes.push(draft); return new Promise((resolve) => { complete = resolve }) })
  app.form.description = 'A new shirt description'
  const photo = new Blob(['photo bytes'])
  app.photoFiles.value.push({ file: photo })
  let navigated = false
  const navigation = app.leave().then((allowed) => { navigated = allowed })
  await tick()
  assert.equal(navigated, false)
  assert.equal(writes[0].form.description, 'A new shirt description')
  assert.equal(writes[0].photos[0].file, photo)
  complete()
  await navigation
  assert.equal(navigated, true)
})

test('overlapping autosaves use one draft ID and write revisions in order', async () => {
  const writes = []
  const completions = []
  const app = editor((draft) => { writes.push(draft); return new Promise((resolve) => completions.push(resolve)) })
  app.form.description = 'First revision'
  const first = app.persistDraft()
  app.form.description = 'Latest revision'
  const second = app.persistDraft()
  await tick()
  assert.equal(writes.length, 1)
  completions.shift()()
  await first
  await tick()
  assert.equal(writes.length, 2)
  assert.equal(writes[0].id, writes[1].id)
  assert.equal(writes[0].form.description, 'First revision')
  assert.equal(writes[1].form.description, 'Latest revision')
  completions.shift()()
  assert.equal(await second, true)
})

test('storage failure keeps the editor open and a later retry succeeds', async () => {
  let fail = true
  const app = editor(async () => { if (fail) throw new Error('Storage full') })
  app.form.description = 'Keep this work'
  assert.equal(await app.leave(), false)
  assert.equal(app.form.description, 'Keep this work')
  assert.equal(app.draftSaveError.value, true)
  assert.match(app.draftStatus.value, /could not be saved/)
  assert.equal(app.toasts.length, 1)
  fail = false
  assert.equal(await app.leave(), true)
  assert.equal(app.draftSaveError.value, false)
})

test('navigation cannot interrupt upload; successful creation can leave without recreating a draft', async () => {
  let writes = 0
  const app = editor(async () => { writes++ })
  app.form.description = 'Shirt'
  app.loading.value = true
  assert.equal(await app.leave(), false)
  app.published()
  assert.equal(await app.leave(), true)
  assert.equal(writes, 0)
})

test('closing an unfinished editor asks the browser to warn', () => {
  const app = editor(async () => {})
  app.form.description = 'Unfinished shirt'
  let prevented = false
  const event = { preventDefault() { prevented = true } }
  app.confirmPageLeave(event)
  assert.equal(prevented, true)
  assert.equal(event.returnValue, '')
})

test('draft storage waits for transaction completion and reports rollback after request success', async () => {
  const script = (await readFile(new URL('../frontend/src/utils/itemDrafts.js', import.meta.url), 'utf8')).replace(/export const/g, 'const')
  for (const abort of [false, true]) {
    const request = { result: 'saved-id' }
    const transaction = { objectStore: () => ({ put: () => request }), error: new Error('Transaction rolled back') }
    const database = { transaction: () => transaction, close() {} }
    const openRequest = { result: database }
    const context = vm.createContext({ indexedDB: { open: () => openRequest } })
    vm.runInContext(`${script}\nglobalThis.save = saveItemDraft`, context)
    let settled = false
    const saving = context.save({ id: 'saved-id' })
    const result = saving.then((value) => { settled = true; return value }, (error) => { settled = true; throw error })
    openRequest.onsuccess()
    await tick()
    request.onsuccess?.()
    await tick()
    assert.equal(settled, false, 'request success alone must not mean the draft is saved')
    if (abort) {
      transaction.onabort()
      await assert.rejects(result, /rolled back/)
    } else {
      transaction.oncomplete()
      assert.equal(await result, 'saved-id')
    }
  }
})
