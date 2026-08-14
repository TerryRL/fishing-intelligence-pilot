import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAppData } from '../contexts/AppDataContext'
import { queueCount } from '../lib/offlineQueue'
import { createWaterBody, syncOfflineQueue } from '../services/dataService'
import FishIcon from '../components/FishIcon'

type SetupView = 'main' | 'lakes' | 'fish'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { waterBodies, species, refresh } = useAppData()
  const [queue, setQueue] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [view, setView] = useState<SetupView>('main')
  const [newWater, setNewWater] = useState('')
  const [waterType, setWaterType] = useState('lake')
  const [busy, setBusy] = useState(false)

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

  async function addWater() {
    if (!newWater.trim() || busy) return
    setBusy(true)
    setMessage(null)
    try {
      await createWaterBody({ name: newWater, water_type: waterType })
      setNewWater('')
      await refresh()
      setMessage('Lake / waterway added.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not add that waterway.')
    } finally {
      setBusy(false)
    }
  }

  if (view === 'lakes') {
    return (
      <div className="page">
        <button className="text-button left" onClick={() => setView('main')}>← Settings</button>
        <header className="page-header"><div><p className="eyebrow">SETUP</p><h1>Lake Setup</h1></div></header>
        <section className="form-card">
          <h2>Add lake / waterway</h2>
          <label>Name<input value={newWater} onChange={(e) => setNewWater(e.target.value)} placeholder="e.g. Lake Simcoe" /></label>
          <label>Type<select value={waterType} onChange={(e) => setWaterType(e.target.value)}>
            <option value="lake">Lake</option><option value="river">River</option><option value="bay">Bay</option><option value="reservoir">Reservoir</option><option value="pond">Pond</option><option value="stream">Stream</option><option value="other">Other</option>
          </select></label>
          <button className="primary-button" disabled={!newWater.trim() || busy} onClick={() => void addWater()}>{busy ? 'Adding…' : 'Add Waterway'}</button>
          {message && <div className="alert success">{message}</div>}
        </section>
        <section>
          <div className="section-heading"><h2>Your lakes & waterways</h2></div>
          <div className="stack">
            {waterBodies.map((water) => <article className="history-card" key={water.id}><div><strong>{water.name}</strong><small>{water.water_type}</small></div><span>✓</span></article>)}
            {!waterBodies.length && <div className="empty-card">No lakes or waterways configured yet.</div>}
          </div>
        </section>
      </div>
    )
  }

  if (view === 'fish') {
    return (
      <div className="page">
        <button className="text-button left" onClick={() => setView('main')}>← Settings</button>
        <header className="page-header"><div><p className="eyebrow">SETUP</p><h1>Fish Setup</h1></div></header>
        <p className="muted">These are the fish available when logging catches. Default graphics are used whenever a catch does not have its own photo.</p>
        <div className="stack">
          {species.map((row) => (
            <article className="inventory-card" key={row.id} style={{ gridTemplateColumns: '58px 1fr' }}>
              <div style={{ width: 54, height: 44, display: 'grid', placeItems: 'center' }}><FishIcon species={row.common_name} size={52} /></div>
              <div className="inventory-copy"><strong>{row.common_name}</strong><small>{row.scientific_name ?? 'Custom / general fish'}</small></div>
            </article>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">ACCOUNT & PILOT</p><h1>Settings</h1></div></header>

      <section className="settings-section">
        <h2>Setup</h2>
        <p>Manage the lists you use while fishing.</p>
        <div className="stack">
          <button className="history-card" onClick={() => navigate('/tackle')}><div><strong>Lure Setup</strong><small>Add, edit, photograph or deactivate lures</small></div><span>›</span></button>
          <button className="history-card" onClick={() => setView('lakes')}><div><strong>Lake Setup</strong><small>Add and review lakes, rivers and waterways</small></div><span>›</span></button>
          <button className="history-card" onClick={() => setView('fish')}><div><strong>Fish Setup</strong><small>Review available Ontario fish and default graphics</small></div><span>›</span></button>
        </div>
      </section>

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

      <button className="danger-button" onClick={() => void signOut()}>Log Out</button>
    </div>
  )
}
