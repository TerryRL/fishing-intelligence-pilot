import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { createCatch, signedPhotoUrl, uploadCatchPhoto } from '../services/dataService'
import FishIcon from '../components/FishIcon'

export default function QuickCatchPage() {
  const navigate = useNavigate()
  const { activeTrip, species, refreshActive } = useAppData()
  const [speciesId, setSpeciesId] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [disposition, setDisposition] = useState<'released' | 'kept' | 'unknown'>('released')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [speciesPhotoUrls, setSpeciesPhotoUrls] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeTrip) navigate('/start', { replace: true })
    else if (activeTrip.target_species_id) setSpeciesId(activeTrip.target_species_id)
  }, [activeTrip, navigate])

  useEffect(() => {
    let cancelled = false
    void Promise.all(
      species.filter((row) => row.photo_path).map(async (row) => [row.id, await signedPhotoUrl(row.photo_path as string)] as const),
    ).then((pairs) => {
      if (cancelled) return
      const next: Record<string, string> = {}
      pairs.forEach(([id, url]) => { if (url) next[id] = url })
      setSpeciesPhotoUrls(next)
    })
    return () => { cancelled = true }
  }, [species])

  const quickSpecies = useMemo(() => {
    const target = species.find((s) => s.id === activeTrip?.target_species_id)
    return target ? [target, ...species.filter((s) => s.id !== target.id)].slice(0, 9) : species.slice(0, 9)
  }, [species, activeTrip?.target_species_id])

  async function save() {
    if (!activeTrip || !speciesId || busy) return
    setBusy(true)
    setError(null)
    try {
      let photoPath: string | null = null
      if (photo) {
        try {
          photoPath = await uploadCatchPhoto(photo)
        } catch {
          setError('The photo could not upload, but the catch will still be saved.')
        }
      }

      await createCatch({
        trip: activeTrip,
        speciesId,
        lengthCm: lengthCm ? Number(lengthCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        disposition,
        notes: notes || null,
        photoPath,
      })
      await refreshActive()
      navigate('/fish', { replace: true, state: { catchSaved: true } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that catch.')
    } finally {
      setBusy(false)
    }
  }

  if (!activeTrip) return null

  return (
    <div className="page immersive-page">
      <header className="simple-header">
        <button onClick={() => navigate('/fish')}>×</button>
        <h1>Nice catch!</h1>
        <span />
      </header>

      <section>
        <p className="field-title">WHAT DID YOU CATCH?</p>
        <div className="species-stack">
          {quickSpecies.map((row, index) => (
            <button
              key={row.id}
              className={`species-choice ${speciesId === row.id ? 'selected' : ''} ${index === 0 ? 'primary-species' : ''}`}
              onClick={() => setSpeciesId(row.id)}
            >
              <span style={{ width: 44, height: 36, borderRadius: 8, overflow: 'hidden', display: 'grid', placeItems: 'center', background: '#143b58' }}>
                {speciesPhotoUrls[row.id] ? <img src={speciesPhotoUrls[row.id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FishIcon species={row.common_name} size={42} />}
              </span>
              <strong>{row.common_name}</strong>
              <span>{speciesId === row.id ? '✓' : '›'}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="field-title">SIZE <span>(optional)</span></p>
        <div className="two-fields">
          <label>Length (cm)<input inputMode="decimal" value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} placeholder="e.g. 45" /></label>
          <label>Weight (kg)<input inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 1.5" /></label>
        </div>
      </section>

      <section>
        <p className="field-title">RELEASE / KEEP <span>(optional)</span></p>
        <div className="segmented">
          <button className={disposition === 'released' ? 'selected' : ''} onClick={() => setDisposition('released')}>Released</button>
          <button className={disposition === 'kept' ? 'selected' : ''} onClick={() => setDisposition('kept')}>Kept</button>
          <button className={disposition === 'unknown' ? 'selected' : ''} onClick={() => setDisposition('unknown')}>Not set</button>
        </div>
      </section>

      <section>
        <p className="field-title">ADD PHOTO <span>(optional)</span></p>
        <label className="photo-drop">
          <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          <span>{photo ? `✓ ${photo.name}` : '＋ Take or choose photo'}</span>
        </label>
      </section>

      <button className="details-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Hide details' : '＋ Add more details'}
      </button>
      {expanded && (
        <section>
          <label>Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Depth, structure, retrieve, observations…" /></label>
        </section>
      )}

      {error && <div className="alert error">{error}</div>}

      <div className="sticky-action">
        <button className="primary-button" disabled={!speciesId || busy} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save Catch'}
        </button>
      </div>
    </div>
  )
}
