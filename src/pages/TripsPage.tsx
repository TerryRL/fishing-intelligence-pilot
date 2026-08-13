import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { formatDate, formatDuration } from '../utils/format'

export default function TripsPage() {
  const navigate = useNavigate()
  const { trips, catches } = useAppData()
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all')
  const rows = useMemo(
    () => trips.filter((trip) => filter === 'all' || trip.status === filter),
    [trips, filter],
  )

  return (
    <div className="page">
      <header className="page-header">
        <div><p className="eyebrow">HISTORY</p><h1>Fishing Trips</h1></div>
      </header>

      <div className="chip-row">
        {(['all', 'completed', 'active'] as const).map((value) => (
          <button key={value} className={filter === value ? 'chip selected' : 'chip'} onClick={() => setFilter(value)}>
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      <div className="stack">
        {rows.map((trip) => {
          const fish = catches.filter((c) => c.trip_id === trip.id).length
          return (
            <button className="history-card" key={trip.id} onClick={() => trip.status === 'active' ? navigate('/fish') : navigate(`/trips/${trip.id}`)}>
              <div>
                <strong>{trip.water_body?.name ?? 'Fishing trip'}</strong>
                <small>{formatDate(trip.started_at)}</small>
                <span>{formatDuration(trip.started_at, trip.ended_at)} · {fish} fish</span>
              </div>
              <span className={`status-badge ${trip.status}`}>{trip.status}</span>
            </button>
          )
        })}
      </div>

      {rows.length === 0 && <div className="empty-card"><strong>No trips here yet.</strong><p>Your fishing history will appear after you log a trip.</p></div>}
    </div>
  )
}
