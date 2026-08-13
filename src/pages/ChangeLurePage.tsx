import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { updateTripCurrentLure } from '../services/dataService'

export default function ChangeLurePage() {
  const navigate = useNavigate()
  const { activeTrip, lures, refreshActive } = useAppData()
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
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

  async function choose(lureId: string) {
    if (!activeTrip) return
    setBusyId(lureId)
    setError(null)
    try {
      await updateTripCurrentLure(activeTrip.id, lureId)
      await refreshActive()
      navigate('/fish', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change lure.')
    } finally {
      setBusyId(null)
    }
  }

  if (!activeTrip) {
    navigate('/start', { replace: true })
    return null
  }

  const favourites = filtered.filter((l) => l.is_favourite)
  const others = filtered.filter((l) => !l.is_favourite)

  const renderLure = (lure: (typeof lures)[number]) => (
    <button
      key={lure.id}
      className={`lure-row ${activeTrip.current_lure_id === lure.id ? 'selected' : ''}`}
      disabled={Boolean(busyId)}
      onClick={() => void choose(lure.id)}
    >
      <span className="lure-glyph">⌁</span>
      <span className="lure-row-copy">
        <strong>{lure.product_name}</strong>
        <small>{[lure.primary_colour, lure.category].filter(Boolean).join(' · ')}</small>
      </span>
      <span>{busyId === lure.id ? '…' : activeTrip.current_lure_id === lure.id ? '✓' : lure.is_favourite ? '★' : '›'}</span>
    </button>
  )

  return (
    <div className="page immersive-page">
      <header className="simple-header">
        <button onClick={() => navigate('/fish')}>×</button>
        <h1>Change Lure</h1>
        <span />
      </header>

      <input className="search-input" placeholder="Search lures…" value={search} onChange={(e) => setSearch(e.target.value)} />
      {error && <div className="alert error">{error}</div>}

      {favourites.length > 0 && (
        <section>
          <div className="section-heading"><h2>Favourites</h2></div>
          <div className="stack">{favourites.map(renderLure)}</div>
        </section>
      )}

      <section>
        <div className="section-heading"><h2>{favourites.length ? 'All other tackle' : 'Tackle'}</h2></div>
        <div className="stack">{others.map(renderLure)}</div>
        {filtered.length === 0 && <div className="empty-card">No tackle matches that search.</div>}
      </section>

      <button className="secondary-button full" onClick={() => navigate('/tackle')}>＋ Add New Lure</button>
    </div>
  )
}
