import { useEffect, useMemo, useState } from 'react'
import { useAppData } from '../contexts/AppDataContext'
import {
  createLure,
  deactivateLure,
  signedPhotoUrl,
  toggleFavourite,
  uploadCatchPhoto,
} from '../services/dataService'
import { requireSupabase } from '../lib/supabase'
import type { Lure } from '../types/domain'

const DEFAULT_CATEGORIES = [
  'soft plastic',
  'jig',
  'jerkbait',
  'crankbait',
  'spinnerbait',
  'swimbait',
  'topwater',
  'spoon',
  'inline spinner',
  'live bait',
  'fly',
  'other',
]

const DEFAULT_COLOURS = [
  'Green Pumpkin',
  'White',
  'Black',
  'Silver',
  'Gold',
  'Chartreuse',
  'Watermelon',
  'Natural',
  'Red',
  'Orange',
  'Blue',
  'Purple',
  'Brown',
  'Yellow',
]

export default function TacklePage() {
  const { lures, refresh } = useAppData()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0])
  const [colour, setColour] = useState(DEFAULT_COLOURS[0])
  const [favourite, setFavourite] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categoryOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_CATEGORIES, ...lures.map((l) => l.category).filter(Boolean)])).sort(),
    [lures],
  )
  const colourOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_COLOURS, ...lures.map((l) => l.primary_colour).filter((v): v is string => Boolean(v))])).sort(),
    [lures],
  )

  useEffect(() => {
    let cancelled = false
    void Promise.all(
      lures.filter((l) => l.photo_path).map(async (lure) => {
        const url = await signedPhotoUrl(lure.photo_path as string)
        return [lure.id, url] as const
      }),
    ).then((pairs) => {
      if (cancelled) return
      const next: Record<string, string> = {}
      pairs.forEach(([id, url]) => { if (url) next[id] = url })
      setPhotoUrls(next)
    })
    return () => { cancelled = true }
  }, [lures])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return lures
    return lures.filter((lure) =>
      [lure.product_name, lure.manufacturer, lure.category, lure.primary_colour]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [lures, search])

  function resetForm() {
    setEditingId(null)
    setName('')
    setManufacturer('')
    setCategory(DEFAULT_CATEGORIES[0])
    setColour(DEFAULT_COLOURS[0])
    setFavourite(false)
    setPhotoFile(null)
    setError(null)
  }

  function addNew() {
    resetForm()
    setShowForm(true)
    setMenuId(null)
  }

  function editLure(lure: Lure) {
    setEditingId(lure.id)
    setName(lure.product_name)
    setManufacturer(lure.manufacturer ?? '')
    setCategory(lure.category)
    setColour(lure.primary_colour ?? '')
    setFavourite(lure.is_favourite)
    setPhotoFile(null)
    setError(null)
    setShowForm(true)
    setMenuId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveLure() {
    if (!name.trim() || !category.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      let lureId = editingId
      if (editingId) {
        const db = requireSupabase()
        const { error: updateError } = await db.from('lures').update({
          product_name: name.trim(),
          manufacturer: manufacturer.trim() || null,
          category: category.trim(),
          primary_colour: colour.trim() || null,
          is_favourite: favourite,
          updated_at: new Date().toISOString(),
        }).eq('id', editingId)
        if (updateError) throw updateError
      } else {
        const created = await createLure({
          product_name: name.trim(),
          manufacturer: manufacturer.trim(),
          category: category.trim(),
          primary_colour: colour.trim(),
          is_favourite: favourite,
        })
        lureId = created.id
      }

      if (photoFile && lureId) {
        const path = await uploadCatchPhoto(photoFile)
        const db = requireSupabase()
        const { error: photoError } = await db.from('lures').update({
          photo_path: path,
          updated_at: new Date().toISOString(),
        }).eq('id', lureId)
        if (photoError) throw photoError
      }

      resetForm()
      setShowForm(false)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that lure.')
    } finally {
      setBusy(false)
    }
  }

  async function favouriteLure(id: string) {
    const lure = lures.find((row) => row.id === id)
    if (!lure) return
    await toggleFavourite(lure)
    await refresh()
  }

  async function retire(id: string) {
    setMenuId(null)
    if (!window.confirm('Deactivate this lure? Historical fishing data will be retained.')) return
    await deactivateLure(id)
    await refresh()
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">INVENTORY</p>
          <h1>My Tackle</h1>
        </div>
        <button className="round-add" onClick={addNew} aria-label="Add lure">＋</button>
      </header>

      <div className="summary-line"><strong>{lures.length}</strong> active lure{lures.length === 1 ? '' : 's'} · {lures.filter((l) => l.is_favourite).length} favourites</div>
      <input className="search-input" placeholder="Search tackle…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {showForm && (
        <section className="form-card">
          <h2>{editingId ? 'Edit lure' : 'Add lure'}</h2>
          <label>Lure name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Finesse TRD" /></label>
          <label>Manufacturer<input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Optional" /></label>
          <div className="two-fields">
            <label>Lure type
              <input list="lure-types" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Choose or type a new type" />
              <datalist id="lure-types">{categoryOptions.map((row) => <option key={row} value={row} />)}</datalist>
            </label>
            <label>Primary colour
              <input list="lure-colours" value={colour} onChange={(e) => setColour(e.target.value)} placeholder="Choose or type a new colour" />
              <datalist id="lure-colours">{colourOptions.map((row) => <option key={row} value={row} />)}</datalist>
            </label>
          </div>
          <label>
            Lure photo
            <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
            <small style={{ color: '#91a9ba', fontWeight: 500 }}>{photoFile ? photoFile.name : editingId ? 'Take a new photo to replace the current one.' : 'Take a photo or choose one from your library.'}</small>
          </label>
          <label className="check-row"><input type="checkbox" checked={favourite} onChange={(e) => setFavourite(e.target.checked)} /> Add to favourites</label>
          {error && <div className="alert error">{error}</div>}
          <div className="button-row">
            <button className="primary-button" disabled={!name.trim() || !category.trim() || busy} onClick={() => void saveLure()}>{busy ? 'Saving…' : editingId ? 'Save Changes' : 'Save Lure'}</button>
            <button className="secondary-button" onClick={() => { resetForm(); setShowForm(false) }}>Cancel</button>
          </div>
        </section>
      )}

      {filtered.length === 0 ? (
        <div className="empty-card"><strong>Your tackle box is empty.</strong><p>Add your first lure so the app can start measuring what works.</p></div>
      ) : (
        <div className="stack">
          {filtered.map((lure) => (
            <article className="inventory-card" key={lure.id} style={{ position: 'relative' }}>
              <div className="lure-avatar" style={{ overflow: 'hidden' }}>
                {photoUrls[lure.id] ? <img src={photoUrls[lure.id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '⌁'}
              </div>
              <div className="inventory-copy">
                <strong>{lure.product_name}</strong>
                <small>{[lure.manufacturer, lure.primary_colour, lure.category].filter(Boolean).join(' · ')}</small>
              </div>
              <button className="star-button" onClick={() => void favouriteLure(lure.id)} aria-label="Favourite">{lure.is_favourite ? '★' : '☆'}</button>
              <button className="more-button" onClick={() => setMenuId(menuId === lure.id ? null : lure.id)} aria-label="Lure options">⋯</button>
              {menuId === lure.id && (
                <div style={{ position: 'absolute', right: 8, top: 54, zIndex: 20, minWidth: 145, background: '#102a3f', border: '1px solid #31536a', borderRadius: 12, padding: 6, boxShadow: '0 10px 30px rgba(0,0,0,.35)' }}>
                  <button onClick={() => editLure(lure)} style={{ width: '100%', minHeight: 42, border: 0, background: 'transparent', textAlign: 'left', padding: '0 10px', cursor: 'pointer' }}>Edit lure</button>
                  <button onClick={() => void retire(lure.id)} style={{ width: '100%', minHeight: 42, border: 0, background: 'transparent', color: '#ffc6c2', textAlign: 'left', padding: '0 10px', cursor: 'pointer' }}>Deactivate</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
