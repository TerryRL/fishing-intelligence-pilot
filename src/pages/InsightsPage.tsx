import { useMemo } from 'react'
import { useAppData } from '../contexts/AppDataContext'
import { buildLurePerformance } from '../utils/analytics'

type ColourPerformance = { colour: string; fish: number; minutes: number; casts: number }

export default function InsightsPage() {
  const { trips, events, catches, lures } = useAppData()
  const completed = trips.filter((t) => t.status === 'completed')
  const performance = useMemo(() => buildLurePerformance(completed, events, catches, lures), [completed, events, catches, lures])
  const totalMinutes = completed.reduce((sum, trip) => {
    if (!trip.ended_at) return sum
    return sum + (new Date(trip.ended_at).getTime() - new Date(trip.started_at).getTime()) / 60_000
  }, 0)
  const totalCasts = events.filter((e) => e.event_type === 'casts_recorded').reduce((sum, e) => sum + (e.cast_quantity ?? 0), 0)
  const bites = events.filter((e) => e.event_type === 'bite').length
  const fishHr = totalMinutes ? catches.length / (totalMinutes / 60) : 0

  const colourAccumulator = performance.reduce<Record<string, ColourPerformance>>((acc, row) => {
    const key = row.colour || 'Unknown'
    acc[key] ??= { colour: key, fish: 0, minutes: 0, casts: 0 }
    acc[key].fish += row.fish
    acc[key].minutes += row.minutesUsed
    acc[key].casts += row.casts
    return acc
  }, {})
  const colourRows = (Object.values(colourAccumulator) as ColourPerformance[])
    .sort((a, b) => (b.minutes ? b.fish / b.minutes : 0) - (a.minutes ? a.fish / a.minutes : 0))

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">PERFORMANCE</p><h1>Insights</h1></div></header>

      <div className="stat-grid">
        <div className="stat-card"><strong>{catches.length}</strong><span>Total fish</span></div>
        <div className="stat-card"><strong>{fishHr.toFixed(2)}</strong><span>Fish / hour</span></div>
        <div className="stat-card"><strong>{bites}</strong><span>Bites</span></div>
        <div className="stat-card"><strong>{totalCasts}</strong><span>Casts</span></div>
      </div>

      <section>
        <div className="section-heading"><h2>Best performing lures</h2></div>
        {performance.length ? performance.slice(0, 8).map((row, index) => (
          <article className="rank-row" key={row.lureId}>
            <span className="rank-number">{index + 1}</span>
            <span className="rank-copy"><strong>{row.lureName}</strong><small>{row.colour} · {row.trips} trip{row.trips === 1 ? '' : 's'} · {row.casts} casts</small></span>
            <span className="rank-metric"><strong>{row.fishPerHour}</strong><small>fish/hr</small></span>
          </article>
        )) : <div className="empty-card"><strong>No performance data yet.</strong><p>Log trips and lure changes to build useful exposure-based analytics.</p></div>}
      </section>

      <section>
        <div className="section-heading"><h2>Colour performance</h2></div>
        <div className="stack">
          {colourRows.slice(0, 8).map((row) => {
            const perHour = row.minutes ? row.fish / (row.minutes / 60) : 0
            return (
              <article className="colour-row" key={row.colour}>
                <span className="colour-dot" />
                <span><strong>{row.colour}</strong><small>{row.casts} casts · {row.fish} fish</small></span>
                <strong>{perHour.toFixed(2)}/hr</strong>
              </article>
            )
          })}
        </div>
      </section>

      <p className="insight-note">Lures are ranked by catch rate and exposure rather than total fish alone. Small samples should be treated cautiously.</p>
    </div>
  )
}
