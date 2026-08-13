import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { queueCount } from '../lib/offlineQueue'
import { syncOfflineQueue } from '../services/dataService'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [queue, setQueue] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function checkSync() {
    const count = await queueCount()
    setQueue(count)
    if (navigator.onLine && count > 0) {
      const result = await syncOfflineQueue()
      setQueue(result.remaining)
      setMessage(result.remaining === 0 ? 'Everything is synced.' : `${result.remaining} item(s) are still waiting to sync.`)
    } else {
      setMessage(count === 0 ? 'Everything is synced.' : `${count} item(s) are waiting to sync.`)
    }
  }

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">ACCOUNT & PILOT</p><h1>Settings</h1></div></header>

      <section className="settings-section">
        <h2>Account</h2>
        <div className="info-list">
          <div><span>Email</span><strong>{user?.email ?? '—'}</strong></div>
          <div><span>Connection</span><strong>{navigator.onLine ? 'Online' : 'Offline'}</strong></div>
        </div>
      </section>

      <section className="settings-section">
        <h2>Offline sync</h2>
        <p>Fishing events are queued locally if Supabase cannot be reached. They are retried when the connection returns.</p>
        <button className="secondary-button full" onClick={() => void checkSync()}>Check / Sync Now</button>
        {queue !== null && <p className="muted">{queue} queued item{queue === 1 ? '' : 's'}.</p>}
        {message && <div className="alert success">{message}</div>}
      </section>

      <section className="settings-section">
        <h2>Pilot notes</h2>
        <p>Locations and catch photos are private by default. Community/social sharing is intentionally not part of this build.</p>
      </section>

      <button className="danger-button" onClick={() => void signOut()}>Log Out</button>
    </div>
  )
}
