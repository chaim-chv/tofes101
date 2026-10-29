// Draft persistence spike — the shape we will ship.
// Storage: IndexedDB (idb-keyval 6.3.0), versioned envelope, explicit migrations.
import { createStore, get, set, del, keys } from 'idb-keyval'

export const APP_ID = 'tofes101' as const
export const SCHEMA_VERSION = 3 as const
export const FORM_YEAR = 2026 as const

export interface DraftData {
  answers: Record<string, string | number | boolean | null>
  meta: {
    completedSections: string[]
    lastStep: string
    lastField?: string
  }
}

export interface Draft {
  app: typeof APP_ID
  schemaVersion: number
  formYear: number
  id: string
  createdAt: string
  updatedAt: string
  /** monotonic per-device counter used for multi-tab conflict detection */
  revision: number
  data: DraftData
}

const store = createStore('tofes101', 'drafts')
const CURRENT_KEY = 'draft:current'

export class ConflictError extends Error {
  constructor(public currentRevision: number) {
    super(`draft was updated elsewhere (revision ${currentRevision})`)
  }
}

const now = () => new Date().toISOString()

export function emptyDraft(id = crypto.randomUUID()): Draft {
  const t = now()
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    formYear: FORM_YEAR,
    id,
    createdAt: t,
    updatedAt: t,
    revision: 1,
    data: { answers: {}, meta: { completedSections: [], lastStep: 'personal' } }
  }
}

/* ------------------------------- migrations ------------------------------ */
// v1: { name, idNumber }                 (early prototype)
// v2: { answers: {...} }                 (flat answers)
// v3: envelope + formYear + revision     (current)
type AnyDraft = Record<string, any>

export const migrations: Record<number, (d: AnyDraft) => AnyDraft> = {
  1: (d) => ({
    ...d,
    schemaVersion: 2,
    data: {
      answers: { 'personal.firstName': d.name ?? '', 'personal.idNumber': d.idNumber ?? '' },
      meta: { completedSections: [], lastStep: 'personal' }
    }
  }),
  2: (d) => ({
    app: APP_ID,
    schemaVersion: 3,
    formYear: d.formYear ?? FORM_YEAR,
    id: d.id ?? crypto.randomUUID(),
    createdAt: d.createdAt ?? now(),
    updatedAt: d.updatedAt ?? now(),
    revision: d.revision ?? 1,
    data: {
      answers: d.data?.answers ?? {},
      meta: { completedSections: [], lastStep: 'personal', ...(d.data?.meta ?? {}) }
    }
  })
}

/** Migrate any stored/imported object to the current schema. Throws on unknown shapes. */
export function migrateDraft(raw: AnyDraft): Draft {
  if (!raw || typeof raw !== 'object') throw new Error('draft: not an object')
  let d: AnyDraft = structuredClone(raw)
  let v = Number(d.schemaVersion ?? 1)
  if (!Number.isFinite(v) || v < 1) throw new Error('draft: bad schemaVersion')
  if (v > SCHEMA_VERSION) {
    throw new Error(`draft: schema ${v} is newer than this app (${SCHEMA_VERSION}) — update the app`)
  }
  while (v < SCHEMA_VERSION) {
    const step = migrations[v]
    if (!step) throw new Error(`draft: no migration from v${v}`)
    d = step(d)
    v = Number(d.schemaVersion)
  }
  if (d.app !== APP_ID) throw new Error('draft: wrong app id')
  if (!d.data || typeof d.data !== 'object' || !d.data.answers) throw new Error('draft: missing data.answers')
  return d as Draft
}

/* -------------------------------- storage -------------------------------- */

export async function loadDraft(): Promise<Draft | null> {
  const raw = await get<AnyDraft>(CURRENT_KEY, store)
  return raw ? migrateDraft(raw) : null
}

/**
 * Saves unless the stored revision is newer (another tab wrote first).
 * Returns the saved draft (with bumped revision + updatedAt).
 */
export async function saveDraft(draft: Draft, opts: { force?: boolean } = {}): Promise<Draft> {
  const stored = await get<AnyDraft>(CURRENT_KEY, store)
  if (stored && !opts.force) {
    const current = migrateDraft(stored)
    if (current.revision > draft.revision) throw new ConflictError(current.revision)
  }
  const next: Draft = {
    ...draft,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: now(),
    revision: (stored ? migrateDraft(stored).revision : draft.revision) + 1
  }
  await set(CURRENT_KEY, next, store)
  return next
}

export async function deleteDraft(): Promise<void> {
  await del(CURRENT_KEY, store)
}

export async function listDraftKeys(): Promise<IDBValidKey[]> {
  return keys(store)
}

export async function storageEstimate() {
  if (!navigator.storage?.estimate) return null
  const { usage = 0, quota = 0 } = await navigator.storage.estimate()
  return { usage, quota, ratio: quota ? usage / quota : 0 }
}

export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

/* ------------------------------ import/export ---------------------------- */

export function exportDraft(draft: Draft): string {
  return JSON.stringify(
    { ...draft, exportedAt: now(), generator: `tofes101@${SCHEMA_VERSION}` },
    null,
    2
  )
}

export function importDraft(text: string, { formYear = FORM_YEAR }: { formYear?: number } = {}): Draft {
  let raw: AnyDraft
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('import: not valid JSON')
  }
  const draft = migrateDraft(raw)
  if (draft.formYear !== formYear) {
    throw new Error(`import: this file is for tax year ${draft.formYear}, the app is on ${formYear}`)
  }
  // imported drafts must not overwrite the current one silently
  return { ...draft, id: crypto.randomUUID(), revision: 1 }
}

/* -------------------------------- autosave ------------------------------- */

/** Debounced saver with explicit flush points (blur, step change, pagehide). */
export function createAutosaver(getDraft: () => Draft, opts: { delay?: number; onError?: (e: unknown) => void } = {}) {
  const delay = opts.delay ?? 800
  let timer: ReturnType<typeof setTimeout> | undefined
  let inflight: Promise<Draft> | undefined

  const flush = async () => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
    const draft = getDraft()
    inflight = saveDraft(draft)
    try {
      return await inflight
    } catch (e) {
      opts.onError?.(e)
      throw e
    } finally {
      inflight = undefined
    }
  }

  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      flush().catch(() => {})
    }, delay)
  }

  const installFlushHooks = () => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush().catch(() => {})
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', () => flush().catch(() => {}))
    return () => {
      document.removeEventListener('visibilitychange', onHide)
    }
  }

  return { schedule, flush, installFlushHooks, get pending() { return !!timer || !!inflight } }
}

/* ------------------------------ multi-tab sync --------------------------- */

export function createDraftChannel(onMessage: (m: { type: string; revision?: number; tabId: string }) => void) {
  if (typeof BroadcastChannel === 'undefined') return { post: () => {}, close: () => {} }
  const tabId = crypto.randomUUID()
  const ch = new BroadcastChannel('tofes101-draft')
  ch.onmessage = (e) => {
    if (e.data?.tabId === tabId) return
    onMessage(e.data)
  }
  return {
    tabId,
    post: (m: Record<string, unknown>) => ch.postMessage({ ...m, tabId }),
    close: () => ch.close()
  }
}
