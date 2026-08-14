import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { signedPhotoUrl } from '../services/dataService'
import { formatDate, formatTime } from '../utils/format'
import FishIcon from '../components/FishIcon'

export default function CatchDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { catches, trips } = useAppData()
  const row = catches.find((catchRow) => catchRow.id === id)
  const trip = trips.find((tripRow) => tripRow.id === row?.trip_id)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!row?.photo_path) {
      setPhotoUrl(null)
      return
    }
    void signedPhotoUrl(row.photo_path).then((url) => {
      if (!cancelled) setPhotoUrl(url)
    })
    return () => { cancelled = true }
  }, [row?.photo_path])

  if (!row) {
    return (
      <div className="page">
        <button className="text-button left" onClick={() => navigate('/map')}>← Back to Map</button>
        <div className="empty-card">Catch not found.</div>
      </div>
    )
  }

  return (
    <div className="page">
      <button className="text-button left" onClick={() => navigate('/map')}>← Back to Map</button>
      <header className="detail-hero">
        <p className="eyebrow">CATCH DETAIL</p>
        <h1>{row.species?.common_name ?? 'Fish'}</h1>
        <p>{formatDate(row.caught_at)} · {formatTime(row.caught_at)}</p>
      </header>

      <div className="catch-detail-visual">
        {photoUrl ? (
          <img src={photoUrl} alt={row.species?.common_name ?? 'Catch'} />
        ) : (
          <FishIcon species={row.species?.common_name} size={170} />
        )}
      </div>

      <section className="settings-section">
        <h2>Catch details</h2>
        <div className="info-list">
          <div><span>Lake / waterway</span><strong>{trip?.water_body?.name ?? '—'}</strong></div>
          <div><span>Date</span><strong>{formatDate(row.caught_at)}</strong></div>
          <div><span>Time</span><strong>{formatTime(row.caught_at)}</strong></div>
          <div><span>Fish</span><strong>{row.species?.common_name ?? '—'}</strong></div>
          <div><span>Lure</span><strong>{row.lure?.product_name ?? 'No lure recorded'}</strong></div>
          <div><span>Length</span><strong>{row.length_cm ? `${row.length_cm} cm` : '—'}</strong></div>
          <div><span>Weight</span><strong>{row.weight_kg ? `${row.weight_kg} kg` : '—'}</strong></div>
          <div><span>Disposition</span><strong>{row.disposition ?? '—'}</strong></div>
          <div><span>Latitude</span><strong>{row.latitude?.toFixed(5) ?? '—'}</strong></div>
          <div><span>Longitude</span><strong>{row.longitude?.toFixed(5) ?? '—'}</strong></div>
        </div>
      </section>

      {row.notes && (
        <section className="settings-section">
          <h2>Notes</h2>
          <p>{row.notes}</p>
        </section>
      )}
    </div>
  )
}
