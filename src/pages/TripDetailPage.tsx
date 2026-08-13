import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { activeStats, buildLurePerformance, conversionRate } from '../utils/analytics'
import { formatDate, formatDuration, formatTime } from '../utils/format'

const EVENT_LABELS: Record<string, string> = {
  trip_started: 'Trip started',
  setup_selected: 'Lure changed',
  casts_recorded: 'Casts logged',
  bite: 'Bite',
  hooked: 'Fish hooked',
  fish_lost: 'Fish lost',
  fish_caught: 'Fish caught',
  spot_marked: 'Spot marked',
  trip_ended: 'Trip ended',
}

export default function TripDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trips, events, catches, lures } = useAppData()
  const trip = trips.find((row) => row.id === id)
  const tripEvents = useMemo(() => events.filter((e) => e.trip_id === id), [events, id])
  const tripCatches = useMemo(() => catches.filter((c) => c.trip_id === id), [catches, id])

  if (!trip) {
    return <div className="page"><button className="text-button left" onClick={() => navigate('/trips')}>← Trips</button><div className="empty-card">Trip not found.</div></div>
  }

  const stats = activeStats(tripEvents, tripCatches)
  const durationMinutes = trip.ended_at
    ? Math.max(0, (new Date(trip.ended_at).getTime() - new Date(trip.started_at).getTime()) / 60_000)
    : Math.max(0, (Date.now() - new Date(trip.started_at).getTime()) / 60_000)
  const fishRate = stats.fish / Math.max(1 / 60, durationMinutes / 60)
  const lurePerf = buildLurePerformance([trip], tripEvents, tripCatches, lures)
  const conversion = conversionRate(stats.fish, stats.bites)

  return (
    <div className="page">
      <button className="text-button left" onClick={() => navigate('/trips')}>← Trips</button>
      <header className="detail-hero">
        <p className="eyebrow">{formatDate(trip.started_at)}</p>
        <h1>{trip.water_body?.name ?? 'Fishing trip'}</h1>
        <p>{formatDuration(trip.started_at, trip.ended_at)} · {trip.target_species?.common_name ?? 'No target species'}</p>
      </header>

      <div className="metric-grid">
        <div><strong>{stats.casts}</strong><span>Casts</span></div>
        <div><strong>{stats.bites}</strong><span>Bites</span></div>
        <div><strong>{stats.fish}</strong><span>Fish</span></div>
        <div><strong>{fishRate.toFixed(1)}</strong><span>Fish/hr</span></div>
      </div>

      <section>
        <div className="section-heading"><h2>Lure performance</h2></div>
        {lurePerf.length ? (
          <div className="stack">
            {lurePerf.map((row) => (
              <article className="performance-row" key={row.lureId}>
                <span><strong>{row.lureName}</strong><small>{row.colour}</small></span>
                <span><strong>{row.fish}</strong><small>fish</small></span>
                <span><strong>{row.casts}</strong><small>casts</small></span>
                <span><strong>{row.fishPerHour}</strong><small>/hr</small></span>
              </article>
            ))}
          </div>
        ) : <div className="empty-card">No lure exposure has been recorded for this trip.</div>}
      </section>

      <section>
        <div className="section-heading"><h2>Trip metrics</h2></div>
        <div className="info-list">
          <div><span>Fish / 100 casts</span><strong>{stats.casts ? ((stats.fish / stats.casts) * 100).toFixed(2) : '—'}</strong></div>
          <div><span>Bite → landed conversion</span><strong>{conversion === null ? '—' : `${conversion}%`}</strong></div>
        </div>
      </section>

      <section>
        <div className="section-heading"><h2>Catches</h2></div>
        {tripCatches.length ? tripCatches.map((row) => (
          <article className="catch-card" key={row.id}>
            <div className="catch-icon">◆</div>
            <span><strong>{row.species?.common_name ?? 'Fish'}</strong><small>{formatTime(row.caught_at)} · {row.lure?.product_name ?? 'No lure'}</small></span>
            <span>{row.length_cm ? `${row.length_cm} cm` : ''}</span>
          </article>
        )) : <div className="empty-card">No landed fish recorded on this trip.</div>}
      </section>

      <section>
        <div className="section-heading"><h2>Timeline</h2></div>
        <div className="timeline">
          {tripEvents.map((event) => (
            <div className="timeline-row" key={event.id}>
              <time>{formatTime(event.event_time)}</time>
              <span className="timeline-dot" />
              <div><strong>{EVENT_LABELS[event.event_type] ?? event.event_type}</strong>
                {event.event_type === 'casts_recorded' && <small>{event.cast_quantity ?? 0} cast(s)</small>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
