/**
 * One IndexedDB, one version. Both stores live here so opening either one can
 * never trigger a blocking upgrade: two modules opening `tofes101` with
 * different versions is a classic hang (the second open waits forever on
 * `blocked`).
 */
export const DB_NAME = "tofes101"
export const DB_VERSION = 2
export const DRAFTS = "drafts"
export const FILES = "files"

let dbPromise: Promise<IDBDatabase> | null = null

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(DRAFTS)) db.createObjectStore(DRAFTS)
      if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error("IndexedDB upgrade blocked by another tab"))
  })
  return dbPromise
}

export function resetDbForTests(): void {
  dbPromise = null
}
