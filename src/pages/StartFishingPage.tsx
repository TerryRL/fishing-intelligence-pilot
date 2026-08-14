import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { createWaterBody, signedPhotoUrl, startTrip } from '../services/dataService'
import { getCurrentPosition } from '../lib/geolocation'

export default function StartFishingPage() {
  const navigate = useNavigate()
  const { waterBodies, species, lures, activeTrip, refresh } = useAppData()
  const [waterBodyId, setWaterBodyId] = useState('')
  const [targetSpeciesId, setTargetSpeciesId] = useState('')
  const [lureId, setLureId] = useState('')
  const [newWater, setNewWater] = useState('')
  const [addingWater, setAddingWater] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (activeTrip) navigate('/fish', { replace: true })
  }, [activeTrip, navigate])

  useEffect(() => {
    if (!waterBodyId && waterBodies[0]) setWaterBodyId(waterBodies[0].id)
    if (!lureId && lures[0]) setLureId(lures[0].id)
  }, [waterBodies, lures, waterBodyId, lureId])

  useEffect(() => {
    let cancelled = false
    void Promise.all(
      lures.filter((l) => l.photo_path).map(async (lure) => [lure.id, await signedPhotoUrl(lure.photo_path as string)] as const),
    ).then((pairs) => {
      if (cancelled) return
      const next: Record<string, string> = {}
      pairs.forEach(([id, url]) => { if (url) next[id] = url })
      setPhotoUrls(next)
    })
    return () => { cancelled = true }
  }, [lures])

  async function addWater() {
    if (!newWater.trim()) return
    setBusy(true)
    setError(null)
    try {
      const geo = await getCurrentPosition()
      const row = await createWaterBody({
        name: newWater,
        water_type: 'lake',
        latitude: geo?.latitude ?? null,
        longitude: geo?.longitude ?? null,
      })
      await refresh()
      setWaterBodyId(row.id)
      setNewWater('')
      setAddingWater(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add that water body.')
    } finally {
      setBusy(false)
    }
  }

  async function begin() {
    if (!waterBodyId) return
    setBusy(true)
    setError(null)
    try {
      await startTrip({
        waterBodyId,
        targetSpeciesId: targetSpeciesId || null,
        lureId: lureId || null,
      })
      await refresh()
      navigate('/fish', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the trip.')
    } finally {
      setBusy(false)
    }
  }

  const favouriteLures = lures.filter((l) => l.is_favourite)
  const quickLures = [...favouriteLures, ...lures.filter((l) => !l.is_favourite)].slice(0, 6)

  return (
    <div className="page immersive-page">
      <header className="simple-header">
        <button onClick={() => navigate(-1)}>Cancel</button>
        <h1>Start Fishing</h1>
        <span />
      </header>

      {error && <div className="alert error">{error}</div>}

      <section>
        <p className="field-title">WHERE ARE YOU FISHING?</p>
        <div className="choice-stack">
          {waterBodies.slice(0, 5).map((water) => (
            <button key={water.id} className={`choice-row ${waterBodyId === water.id ? 'selected' : ''}`} onClick={() => setWaterBodyId(water.id)}>
              <span>◉</span><strong>{water.name}</strong><span>{waterBodyId === water.id ? '✓' : '›'}</span>
            </button>
          ))}
        </div>
        {addingWater ? (
          <div className="inline-form">
            <input placeholder="Lake, river, bay…" value={newWater} onChange={(e) => setNewWater(e.target.value)} />
            <button className="secondary-button" disabled={busy} onClick={() => void addWater()}>Add</button>
          </div>
        ) : <button className="text-button left" onClick={() => setAddingWater(true)}>+ Add another body of water</button>}
      </section>

      <section>
        <p className="field-title">TARGET SPECIES <span>(optional)</span></p>
        <div className="chip-row">
          <button className={!targetSpeciesId ? 'chip selected' : 'chip'} onClick={() => setTargetSpeciesId('')}>No target</button>
          {species.slice(0, 8).map((row) => (
            <button key={row.id} className={targetSpeciesId === row.id ? 'chip selected' : 'chip'} onClick={() => setTargetSpeciesId(row.id)}>
              {row.common_name.replace(' Bass', '')}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="field-title">STARTING LURE <span>(optional)</span></p>
        {lures.length === 0 ? (
          <div className="empty-card"><strong>No tackle added yet.</strong><p>You can start without a lure, or add one first.</p><button className="secondary-button" onClick={() => navigate('/tackle')}>Add Tackle</button></div>
        ) : (
          <div className="lure-pick-grid">
            {quickLures.map((lure) => (
              <button className={`lure-pick ${lureId === lure.id ? 'selected' : ''}`} key={lure.id} onClick={() => setLureId(lure.id)}>
                <span style={{ width: 54, height: 54, borderRadius: 12, overflow: 'hidden', display: 'grid', placeItems: 'center', background: '#143b58', color: '#7ec2ff', fontSize: '1.65rem' }}>
                  {photoUrls[lure.id] ? <img src={photoUrls[lure.id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '⌁'}
                </span>
                <strong>{lure.product_name}</strong>
                <small>{lure.primary_colour ?? lure.category}</small>
              </button>
            ))}
          </div>
        )}
        <button className="text-button left" onClick={() => navigate('/tackle')}>View all tackle</button>
      </section>

      <div className="sticky-action"><button className="primary-button" disabled={!waterBodyId || busy} onClick={() => void begin()}>{busy ? 'Starting…' : 'Start Fishing'}</button></div>
    </div>
  )
}
