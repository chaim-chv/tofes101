/**
 * Attachment storage: IndexedDB blobs, keyed by a fixed slot id.
 *
 * Kept out of `FormState` on purpose — a draft is JSON (exportable, small,
 * inspectable), while a scanned ID is a megabyte of binary. Mixing them would
 * make export/import slow and would put an ID scan in a file people email around.
 */
import { FILES, openDb } from "./idb"

export type SlotId = "id-front" | "id-annex" | "passport" | "residence"

export type Attachment = {
  slot: SlotId
  name: string
  type: string
  size: number
  addedAt: string
}

export type AttachmentWithBytes = Attachment & { bytes: Uint8Array }

/** UI-ready attachment: an object URL plus which viewer it needs. */
export type AttachmentView = {
  slot: SlotId
  name: string
  type: string
  size: number
  url: string
  isPdf: boolean
  isImage: boolean
  /** Null until (or unless) pdf-lib reads the page count. */
  pages: number | null
}

type Record_ = { blob: Blob; name: string; type: string; size: number; addedAt: string }

async function put(slot: SlotId, record: Record_): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).put(record, slot)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function del(slot: SlotId): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).delete(slot)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getAll(): Promise<Array<Record_ & { slot: SlotId }>> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const store = tx.objectStore(STORE)
    const out: Array<Record_ & { slot: SlotId }> = []
    const cursorRequest = store.openCursor()
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result
      if (!cursor) return
      out.push({ slot: cursor.key as SlotId, ...(cursor.value as Record_) })
      cursor.continue()
    }
    tx.oncomplete = () => resolve(out)
    tx.onerror = () => reject(tx.error)
  })
}

const MAX_BYTES = 12 * 1024 * 1024
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

export const STORE = FILES

export function validateFile(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "type"
  if (file.size > MAX_BYTES) return "size"
  return null
}

export function createAttachmentStore() {
  return {
    async list(): Promise<Attachment[]> {
      const rows = await getAll()
      return rows.map(({ slot, name, type, size, addedAt }) => ({ slot, name, type, size, addedAt }))
    },

    async add(slot: SlotId, file: File): Promise<Attachment> {
      const record: Record_ = {
        blob: file,
        name: file.name,
        type: file.type,
        size: file.size,
        addedAt: new Date().toISOString(),
      }
      await put(slot, record)
      return { slot, name: record.name, type: record.type, size: record.size, addedAt: record.addedAt }
    },

    async remove(slot: SlotId): Promise<void> {
      await del(slot)
    },

    async clear(): Promise<void> {
      const rows = await getAll()
      for (const row of rows) await del(row.slot)
    },

    /** Bytes for the PDF renderer, in a deterministic order. */
    async loadForPdf(): Promise<AttachmentWithBytes[]> {
      const rows = await getAll()
      const order: SlotId[] = ["id-front", "id-annex", "passport", "residence"]
      rows.sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot))
      return Promise.all(
        rows.map(async (row) => ({
          slot: row.slot,
          name: row.name,
          type: row.type,
          size: row.size,
          addedAt: row.addedAt,
          bytes: new Uint8Array(await row.blob.arrayBuffer()),
        })),
      )
    },
  }
}

export type AttachmentStore = ReturnType<typeof createAttachmentStore>
