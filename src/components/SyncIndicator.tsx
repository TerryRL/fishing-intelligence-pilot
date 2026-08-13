import { useEffect, useState } from 'react'
import { queueCount } from '../lib/offlineQueue'
import { syncOfflineQueue } from '../services/dataService'

export default function SyncIndicator() {
  const [online, setOnline] = useState(navigator.onLine)
  const [queued, setQueued] = useState(0)
  const [syncing, setSyncing] = useState(false)

  async function refreshCount() {
    try {
      setQueued(await queueCount())
    } catch {
      setQueued(0)
    }
  }

  async function sync() {
    if (!navigator.onLine || syncing) return
    setSyncing(true)
    try {
      await syncOfflineQueue()
      await refreshCount()
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    void refreshCount()
    const onlineHandler = () => {
      setOnline(true)
      void sync()
    }
    const offlineHandler = () => setOnline(false)
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)
    const timer = window.setInterval(() => void refreshCount(), 5000)
    return () => {
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)
      window.clearInterval(timer)
    }
  }, [])

  if (online && queued === 0 && !syncing) return null

  return (
    <button className="sync-pill" onClick={() => void sync()} type="button">
      {syncing ? 'Syncing…' : !online ? `Offline · ${queued} queued` : `${queued} waiting · Sync`}
    </button>
  )
}
