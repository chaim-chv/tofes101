/**
 * Draft persistence: IndexedDB, one record, versioned envelope.
 *
 * Why IndexedDB and not localStorage: no 5 MB cap, structured clone, and no
 * synchronous main-thread stalls. Why not a library: we need exactly get/set/del
 * on one key; a dependency would add failure modes without removing any.
 *
 * The envelope is intentionally self-describing so an exported file can be
 * validated on import (and refused) without guessing.
 */
import type { FormState } from "~/form/types"
import { emptyState } from "~/form/values"
import { SCHEMA_VERSION } from "~/form/values"

export { SCHEMA_VERSION }

const DB_NAME = "tofes101"
const DB_VERSION = 1
const STORE = "drafts"
const KEY = "draft"

export type Envelope = {
  app: "tofes101"
  schema: number
  savedAt: string
  state: FormState
}

export type ImportResult =
  | { ok: true; state: FormState }
  | { ok: false; reason: "unavailable" | "parse" | "foreign" | "newer" | "shape" }

/* ------------------------------------------------------------------ idb glue */

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve((req.result as T) ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function idbDel(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/* ---------------------------------------------------------------- validation */

export function isFormState(value: unknown): value is FormState {
  if (!value || typeof value !== "object") return false
  const s = value as FormState
  return (
    !!s.meta &&
    typeof s.meta.schema === "number" &&
    typeof s.meta.taxYear === "number" &&
    typeof s.meta.step === "number" &&
    !!s.values &&
    typeof s.values === "object" &&
    !!s.hidden &&
    typeof s.hidden === "object"
  )
}

export function envelopeOf(state: FormState): Envelope {
  return { app: "tofes101", schema: SCHEMA_VERSION, savedAt: new Date().toISOString(), state }
}

export function parseEnvelope(raw: unknown): ImportResult {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "shape" }
  const env = raw as Partial<Envelope>
  if (env.app !== "tofes101") return { ok: false, reason: "foreign" }
  if (typeof env.schema !== "number") return { ok: false, reason: "shape" }
  if (env.schema > SCHEMA_VERSION) return { ok: false, reason: "newer" }
  const state = env.state ?? raw // allow a bare FormState export
  if (!isFormState(state)) return { ok: false, reason: "shape" }
  if (state.meta.schema > SCHEMA_VERSION) return { ok: false, reason: "newer" }
  return { ok: true, state: migrate(state) }
}

/**
 * Migrations run forward only, one version at a time. Each entry must be pure so
 * it can be unit-tested with fixtures.
 */
export const migrations: Record<number, (s: FormState) => FormState> = {
  // 0 -> 1: the first released shape; nothing to do.
  0: (s) => ({ ...s, meta: { ...s.meta, schema: 1 } }),
}

export function migrate(state: FormState): FormState {
  let current = state
  let version = state.meta.schema
  while (version < SCHEMA_VERSION) {
    const step = migrations[version]
    if (!step) break
    current = step(current)
    version = current.meta.schema
  }
  return current
}

/* -------------------------------------------------------------------- store */

/** Serialise a draft as the same envelope used for export. */
export function encodeDraft(state: FormState): Blob {
  return new Blob([JSON.stringify(envelopeOf(state), null, 2)], { type: "application/json" })
}

export function createDraftStore() {
  return {
    async load(): Promise<FormState | null> {
      const env = await idbGet<Envelope>(KEY)
      if (!env) return null
      const result = parseEnvelope(env)
      return result.ok ? result.state : null
    },

    async save(state: FormState): Promise<void> {
      // `state` is a Vue reactive proxy; structured clone cannot serialise it.
      // toRaw + JSON keeps us honest about what a draft may contain.
      await idbSet(KEY, JSON.parse(JSON.stringify(envelopeOf(state))))
    },

    async clear(): Promise<void> {
      await idbDel(KEY)
    },

    export(state: FormState): Blob {
      const env = envelopeOf(state)
      return new Blob([JSON.stringify(env, null, 2)], { type: "application/json" })
    },

    async import(file: File): Promise<ImportResult> {
      let raw: unknown
      try {
        raw = JSON.parse(await file.text())
      } catch {
        return { ok: false, reason: "parse" }
      }
      return parseEnvelope(raw)
    },
  }
}

export type DraftStore = ReturnType<typeof createDraftStore>

/** A fresh, empty draft — used by tests and by "start over". */
export function blankDraft(taxYear = 2026): FormState {
  return emptyState(taxYear)
}
