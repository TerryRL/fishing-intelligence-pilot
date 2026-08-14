import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAppData } from '../contexts/AppDataContext'
import { queueCount } from '../lib/offlineQueue'
import { requireSupabase } from '../lib/supabase'
import { createWaterBody, signedPhotoUrl, syncOfflineQueue, uploadCatchPhoto } from '../services/dataService'
import FishIcon from '../components/FishIcon'
import type { Species } from '../types/domain'

type SetupView = 'main' | 'lakes' | 'fish' | 'waterTypes'

const DEFAULT_WATER_TYPES = ['lake', 'river', 'bay', 'reservoir', 'pond', 'stream', 'other']

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { waterBodies, species, refresh } = useAppData()
  const [queue, setQueue] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [view, setView] = useState<SetupView>('main')
  const [newWater, setNewWater] = useState('')
  const [waterType, setWaterType] = useState('lake')
  const [customWaterTypes, setCustomWaterTypes] = useState<string[]>([])
  const [newWaterType, setNewWaterType] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingFish, setEditingFish] = useState<Species | null>(null)
  const [fishName, setFishName] = useState('')
  const [fishScientific, setFishScientific] = useState('')
  const [fishPhoto, setFishPhoto] = useState<File | null>(null)
  const [fishPhotoUrls, setFishPhotoUrls] = useState<Record<string, string>>({})

  const allWaterTypes = useMemo(
    () => Array.from(new Set([...DEFAULT_WATER_TYPES, ...customWaterTypes])).sort(),
    [customWaterTypes],
  )

  useEffect(() => {
    if (!user) return
    const db = requireSupabase()
    void db.from('waterway_types').select('name').order('name').then(({ data }) => {
      if (data) setCustomWaterTypes(data.map((row) => String(row.name)))
    })
  }, [user])

  useEffect(() => {
    let cancelled = false
    void Promise.all(
      species.filter((row) => row.photo_path).map(async (row) => [row.id, await signedPhotoUrl(row.photo_path as string)] as const),
    ).then((pairs) => {
      if (cancelled) return
      const next: Record<string, string> = {}
      pairs.forEach(([id, url]) => { if (url) next[id] = url })
      setFishPhotoUrls(next)
    })
    return () => { cancelled = true }
  }, [species])

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

  async function addWaterType() {
    if (!user || !newWaterType.trim() || busy) return
    setBusy(true)
    setMessage(null)
    const name = newWaterType.trim().toLowerCase()
    try {
      const db = requireSupabase()
      const { error } = await db.from('waterway_types').upsert({ user_id: user.id, name }, { onConflict: 'user_id,name' })
      if (error) throw error
      setCustomWaterTypes((rows) => Array.from(new Set([...rows, name])).sort())
      setWaterType(name)
      setNewWaterType('')
      setMessage(`Waterway type “${name}” added.`)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not add that waterway type.')
    } finally {
      setBusy(false)
    }
  }

  function startAddFish() {
    setEditingFish(null)
    setFishName('')
    setFishScientific('')
    setFishPhoto(null)
    setMessage(null)
  }

  function startEditFish(row: Species) {
    setEditingFish(row)
    setFishName(row.common_name)
    setFishScientific(row.scientific_name ?? '')
    setFishPhoto(null)
    setMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveFish() {
    if (!user || !fishName.trim() || busy) return
    setBusy(true)
    setMessage(null)
    try {
      const db = requireSupabase()
      let photoPath = editingFish?.photo_path ?? null
      if (fishPhoto) photoPath = await uploadCatchPhoto(fishPhoto)

      if (!editingFish) {
        const { error } = await db.from('species').insert({
          user_id: user.id,
          source_species_id: null,
          common_name: fishName.trim(),
          scientific_name: fishScientific.trim() || null,
          photo_path: photoPath,
          sort_order: 900,
          is_active: true,
        })
        if (error) throw error
      } else if (editingFish.user_id === user.id) {
        const { error } = await db.from('species').update({
          common_name: fishName.trim(),
          scientific_name: fishScientific.trim() || null,
          photo_path: photoPath,
        }).eq('id', editingFish.id)
        if (error) throw error
      } else {
        const { error } = await db.from('species').insert({
          user_id: user.id,
          source_species_id: editingFish.id,
          common_name: fishName.trim(),
          scientific_name: fishScientific.trim() || null,
          photo_path: photoPath,
          sort_order: editingFish.sort_order,
          is_active: true,
        })
        if (error) throw error
      }

      setEditingFish(null)
      setFishName('')
      setFishScientific('')
      setFishPhoto(null)
      await refresh()
      setMessage('Fish setup saved.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save that fish.')
    } finally {
      setBusy(false)
    }
  }

  async function removeFishPhoto(row: Species) {
    if (!user || row.user_id !== user.id || !row.photo_path) return
    if (!window.confirm('Remove this fish photo? The default fish graphic will be used again.')) return
    const db = requireSupabase()
    const oldPath = row.photo_path
    const { error } = await db.from('species').update({ photo_path: null }).eq('id', row.id)
    if (error) {
      setMessage(error.message)
      return
    }
    await db.storage.from('catch-photos').remove([oldPath])
    await refresh()
    setMessage('Fish photo removed. Default graphic restored.')
  }

  if (view === 'waterTypes') {
    return (
      <div className="page">
        <button className="text-button left" onClick={() => setView('lakes')}>← Lake Setup</button>
        <header className="page-header"><div><p className="eyebrow">SETUP</p><h1>Waterway Types</h1></div></header>
        <section className="form-card">
          <h2>Create a waterway type</h2>
          <label>Type name<input value={newWaterType} onChange={(e) => setNewWaterType(e.target.value)} placeholder="e.g. canal, harbour, creek" /></label>
          <button className="primary-button" disabled={!newWaterType.trim() || busy} onClick={() => void addWaterType()}>{busy ? 'Adding…' : 'Add Type'}</button>
          {message && <div className="alert success">{message}</div>}
        </section>
        <section className="settings-section">
          <h2>Available types</h2>
          <div className="chip-row">{allWaterTypes.map((type) => <span className="chip" key={type}>{type}</span>)}</div>
        </section>
      </div>
    )
  }

  if (view === 'lakes') {
    return (
      <div className="page">
        <button className="text-button left" onClick={() => setView('main')}>← Settings</button>
        <header className="page-header"><div><p className="eyebrow">SETUP</p><h1>Lake Setup</h1></div></header>
        <section className="form-card">
          <h2>Add lake / waterway</h2>
          <label>Name<input value={newWater} onChange={(e) => setNewWater(e.target.value)} placeholder="e.g. Lake Simcoe" /></label>
          <label>Type<select value={waterType} onChange={(e) => setWaterType(e.target.value)}>{allWaterTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
          <button className="text-button left" onClick={() => setView('waterTypes')}>＋ Create another waterway type</button>
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
    const formOpen = editingFish !== null || fishName !== '' || fishScientific !== '' || fishPhoto !== null
    return (
      <div className="page">
        <button className="text-button left" onClick={() => setView('main')}>← Settings</button>
        <header className="page-header">
          <div><p className="eyebrow">SETUP</p><h1>Fish Setup</h1></div>
          <button className="round-add" onClick={startAddFish} aria-label="Add fish">＋</button>
        </header>
        <p className="muted">Default Ontario fish remain shared and safe. Editing a default creates your own private version.</p>

        {formOpen && (
          <section className="form-card">
            <h2>{editingFish ? 'Edit fish' : 'Add fish'}</h2>
            <label>Fish name<input value={fishName} onChange={(e) => setFishName(e.target.value)} placeholder="e.g. Smallmouth Bass" /></label>
            <label>Scientific name<input value={fishScientific} onChange={(e) => setFishScientific(e.target.value)} placeholder="Optional" /></label>
            <label>Fish photo<input type="file" accept="image/*" capture="environment" onChange={(e) => setFishPhoto(e.target.files?.[0] ?? null)} /></label>
            <div className="button-row">
              <button className="primary-button" disabled={!fishName.trim() || busy} onClick={() => void saveFish()}>{busy ? 'Saving…' : 'Save Fish'}</button>
              <button className="secondary-button" onClick={() => { setEditingFish(null); setFishName(''); setFishScientific(''); setFishPhoto(null) }}>Cancel</button>
            </div>
          </section>
        )}

        {message && <div className="alert success">{message}</div>}
        <div className="stack">
          {species.map((row) => (
            <article className="inventory-card" key={row.id} style={{ gridTemplateColumns: '58px 1fr 44px' }}>
              <div style={{ width: 54, height: 44, borderRadius: 10, overflow: 'hidden', display: 'grid', placeItems: 'center', background: '#143b58' }}>
                {fishPhotoUrls[row.id] ? <img src={fishPhotoUrls[row.id]} alt={row.common_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FishIcon species={row.common_name} size={52} />}
              </div>
              <div className="inventory-copy">
                <strong>{row.common_name}</strong>
                <small>{row.scientific_name ?? 'No scientific name'}{row.user_id ? ' · Your version' : ' · Default'}</small>
                {row.user_id === user?.id && row.photo_path && <button className="text-button compact" style={{ textAlign: 'left', color: '#ffc6c2' }} onClick={() => void removeFishPhoto(row)}>Remove photo</button>}
              </div>
              <button className="more-button" onClick={() => startEditFish(row)} aria-label={`Edit ${row.common_name}`}>✎</button>
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
          <button className="history-card" onClick={() => setView('lakes')}><div><strong>Lake Setup</strong><small>Add waterways and create your own waterway types</small></div><span>›</span></button>
          <button className="history-card" onClick={() => { setView('fish'); startAddFish(); setFishName('') }}><div><strong>Fish Setup</strong><small>Add, edit and photograph fish entries</small></div><span>›</span></button>
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
