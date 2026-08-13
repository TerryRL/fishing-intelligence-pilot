import { useMemo, useState } from 'react'
import { useAppData } from '../contexts/AppDataContext'
import { createLure, deactivateLure, toggleFavourite } from '../services/dataService'

const CATEGORIES = [
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

const COLOURS = [
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
  const [name, setName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [colour, setColour] = useState(COLOURS[0])
  const [favourite, setFavourite] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return lures
    return lures.filter((lure) =>
      [lure.product_name, lure.manufacturer, lure.category, lure.primary_colour]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [lures, search])

  async function saveLure() {
    if (!name.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await createLure({
        product_name: name,
        manufacturer,
        category,
        primary_colour: colour,
        is_favourite: favourite,
      })
      setName('')
      setManufacturer('')
      setFavourite(false)
      setShowForm(false)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add that lure.')
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
        <button className="round-add" onClick={() => setShowForm(!showForm)} aria-label="Add lure">＋</button>
      </header>

      <div className="summary-line"><strong>{lures.length}</strong> active lure{lures.length === 1 ? '' : 's'} · {lures.filter((l) => l.is_favourite).length} favourites</div>
      <input className="search-input" placeholder="Search tackle…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {showForm && (
        <section className="form-card">
          <h2>Add lure</h2>
          <label>Lure name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Finesse TRD" /></label>
          <label>Manufacturer<input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="Optional" /></label>
          <div className="two-fields">
            <label>Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((row) => <option key={row}>{row}</option>)}
              </select>
            </label>
            <label>Primary colour
              <select value={colour} onChange={(e) => setColour(e.target.value)}>
                {COLOURS.map((row) => <option key={row}>{row}</option>)}
              </select>
            </label>
          </div>
          <label className="check-row"><input type="checkbox" checked={favourite} onChange={(e) => setFavourite(e.target.checked)} /> Add to favourites</label>
          {error && <div className="alert error">{error}</div>}
          <div className="button-row">
            <button className="primary-button" disabled={!name.trim() || busy} onClick={() => void saveLure()}>{busy ? 'Saving…' : 'Save Lure'}</button>
            <button className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </section>
      )}

      {filtered.length === 0 ? (
        <div className="empty-card"><strong>Your tackle box is empty.</strong><p>Add your first lure so the app can start measuring what works.</p></div>
      ) : (
        <div className="stack">
          {filtered.map((lure) => (
            <article className="inventory-card" key={lure.id}>
              <div className="lure-avatar">⌁</div>
              <div className="inventory-copy">
                <strong>{lure.product_name}</strong>
                <small>{[lure.manufacturer, lure.primary_colour, lure.category].filter(Boolean).join(' · ')}</small>
              </div>
              <button className="star-button" onClick={() => void favouriteLure(lure.id)} aria-label="Favourite">{lure.is_favourite ? '★' : '☆'}</button>
              <button className="more-button" onClick={() => void retire(lure.id)} aria-label="Deactivate">⋯</button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
