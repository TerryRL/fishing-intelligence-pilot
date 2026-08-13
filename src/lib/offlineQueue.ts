type QueueKind = 'fishing_event' | 'catch' | 'trip_update'

export interface QueuedMutation {
  id: string
  kind: QueueKind
  payload: Record<string, unknown>
  createdAt: string
}

const DB_NAME = 'fishing-intelligence'
const STORE_NAME = 'offline-queue'
const VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function enqueueMutation(item: QueuedMutation): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function listQueuedMutations(): Promise<QueuedMutation[]> {
  const db = await openDb()
  const rows = await new Promise<QueuedMutation[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result as QueuedMutation[])
    req.onerror = () => reject(req.error)
  })
  db.close()
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function removeQueuedMutation(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function queueCount(): Promise<number> {
  const db = await openDb()
  const count = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return count
}
