import { useNavigate } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { activeStats, buildLurePerformance } from '../utils/analytics'
import { formatDate, formatDuration } from '../utils/format'

export default function HomePage() {
  const navigate = useNavigate()
  const { activeTrip, trips, events, catches, lures, loading, error } = useAppData()
  const completed = trips.filter((trip) => trip.status === 'completed')
  const performance = buildLurePerformance(completed, events, catches, lures)
  const best = performance[0]
  const totalMinutes = completed.reduce((sum, trip) => {
    if (!trip.ended_at) return sum
    return sum + (new Date(trip.ended_at).getTime() - new Date(trip.started_at).getTime()) / 60_000
  }, 0)
  const overallRate = totalMinutes > 0 ? catches.length / (totalMinutes / 60) : 0
  const activeEvents = activeTrip ? events.filter((e) => e.trip_id === activeTrip.id) : []
  const activeCatches = activeTrip ? catches.filter((c) => c.trip_id === activeTrip.id) : []
  const stats = activeStats(activeEvents, activeCatches)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Fishing Intelligence</p>
          <h1>Ready to fish?</h1>
        </div>
        <button className="icon-button" onClick={() => navigate('/settings')} aria-label="Settings">⚙</button>
      </header>

      {error && <div className="alert error">{error}</div>}

      <section className="hero-card">
        {activeTrip ? (
          <>
            <p className="eyebrow">ACTIVE TRIP</p>
            <h2>{activeTrip.water_body?.name ?? 'Fishing trip'}</h2>
            <p>{formatDuration(activeTrip.started_at)} · {stats.fish} fish · {stats.casts} casts</p>
            <p className="muted">Current: {activeTrip.current_lure?.product_name ?? 'No lure selected'}</p>
            <button className="primary-button" onClick={() => navigate('/fish')}>Continue Fishing</button>
          </>
        ) : (
          <>
            <p className="eyebrow">ON THE WATER</p>
            <h2>Start a fishing trip</h2>
            <p>Log fast now. Learn what works later.</p>
            <button className="primary-button" onClick={() => navigate('/start')}>Start Fishing</button>
          </>
        )}
      </section>

      <button className="recommend-card" onClick={() => navigate('/recommend')}>
        <span>
          <strong>What should I use?</strong>
          <small>Recommendations from your own fishing history</small>
        </span>
        <span className="bulb">✦</span>
      </button>

      <section>
        <div className="section-heading"><h2>Quick stats</h2><button onClick={() => navigate('/insights')}>Insights →</button></div>
        <div className="stat-grid">
          <div className="stat-card"><strong>{catches.length}</strong><span>Fish caught</span></div>
          <div className="stat-card"><strong>{completed.length}</strong><span>Trips</span></div>
          <div className="stat-card"><strong>{overallRate.toFixed(1)}</strong><span>Fish / hour</span></div>
          <div className="stat-card"><strong>{best?.lureName ?? '—'}</strong><span>Best lure</span></div>
        </div>
      </section>

      <section>
        <div className="section-heading"><h2>Recent trips</h2><button onClick={() => navigate('/trips')}>View all →</button></div>
        {loading && <p className="muted">Loading trips…</p>}
        {!loading && completed.length === 0 && (
          <div className="empty-card"><strong>No trips yet.</strong><p>Start fishing and your history will appear here.</p></div>
        )}
        <div className="stack">
          {completed.slice(0, 4).map((trip) => {
            const tripFish = catches.filter((c) => c.trip_id === trip.id).length
            return (
              <button className="trip-card" key={trip.id} onClick={() => navigate(`/trips/${trip.id}`)}>
                <span>
                  <strong>{trip.water_body?.name ?? 'Fishing trip'}</strong>
                  <small>{formatDate(trip.started_at)} · {formatDuration(trip.started_at, trip.ended_at)}</small>
                </span>
                <span className="trip-fish">{tripFish} fish</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
