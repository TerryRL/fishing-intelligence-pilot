import { useEffect, useMemo, useState } from 'react'
import { useAppData } from '../contexts/AppDataContext'
import { requireSupabase } from '../lib/supabase'
import type { Lure } from '../types/domain'

type ViewMode = 'all' | 'lake' | 'year' | 'lakeYear'
type SortKey = 'name' | 'casts' | 'bites' | 'catches' | 'activity' | 'bitePct' | 'catchPct' | 'activityPct'
type ChartMetric = Exclude<SortKey, 'name'>

type RankingRow = {
  lureId: string
  name: string
  casts: number
  bites: number
  catches: number
  activity: number
  bitePct: number
  catchPct: number
  activityPct: number
}

const metricLabels: Record<ChartMetric, string> = {
  casts: '# Casts',
  bites: '# Bites',
  catches: '# Catches',
  activity: '# Bites + Catches',
  bitePct: '% Bites / Casts',
  catchPct: '% Catches / Casts',
  activityPct: '% Bites + Catches / Casts',
}

export default function InsightsPage() {
  const { trips, events, catches, lures, waterBodies } = useAppData()
  const [allLures, setAllLures] = useState<Lure[]>(lures)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [lakeId, setLakeId] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [sortKey, setSortKey] = useState<SortKey>('catches')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [chartMetric, setChartMetric] = useState<ChartMetric>('catches')

  useEffect(() => {
    setAllLures(lures)
    const db = requireSupabase()
    void db.from('lures').select('*').order('product_name').then(({ data }) => {
      if (data) setAllLures(data as Lure[])
    })
  }, [lures])

  const completed = useMemo(() => trips.filter((t) => t.status === 'completed'), [trips])
  const years = useMemo(() => {
    const values = Array.from(new Set(completed.map((t) => String(new Date(t.started_at).getFullYear())))).sort((a, b) => Number(b) - Number(a))
    return values.length ? values : [String(new Date().getFullYear())]
  }, [completed])

  useEffect(() => {
    if (!lakeId && waterBodies[0]) setLakeId(waterBodies[0].id)
  }, [lakeId, waterBodies])

  useEffect(() => {
    if (!years.includes(year)) setYear(years[0])
  }, [year, years])

  const relevantTrips = useMemo(() => completed.filter((trip) => {
    const matchesLake = trip.water_body_id === lakeId
    const matchesYear = String(new Date(trip.started_at).getFullYear()) === year
    if (viewMode === 'lake') return matchesLake
    if (viewMode === 'year') return matchesYear
    if (viewMode === 'lakeYear') return matchesLake && matchesYear
    return true
  }), [completed, lakeId, year, viewMode])

  const tripIds = useMemo(() => new Set(relevantTrips.map((t) => t.id)), [relevantTrips])
  const relevantEvents = useMemo(() => events.filter((e) => tripIds.has(e.trip_id)), [events, tripIds])
  const relevantCatches = useMemo(() => catches.filter((c) => tripIds.has(c.trip_id)), [catches, tripIds])

  const rows = useMemo<RankingRow[]>(() => allLures.map((lure) => {
    const lureEvents = relevantEvents.filter((e) => e.lure_id === lure.id)
    const casts = lureEvents.filter((e) => e.event_type === 'casts_recorded').reduce((sum, e) => sum + (e.cast_quantity ?? 0), 0)
    const bites = lureEvents.filter((e) => e.event_type === 'bite').length
    const landed = relevantCatches.filter((c) => c.lure_id === lure.id).length
    const activity = bites + landed
    return {
      lureId: lure.id,
      name: lure.product_name,
      casts,
      bites,
      catches: landed,
      activity,
      bitePct: casts ? (bites / casts) * 100 : 0,
      catchPct: casts ? (landed / casts) * 100 : 0,
      activityPct: casts ? (activity / casts) * 100 : 0,
    }
  }), [allLures, relevantEvents, relevantCatches])

  const sortedRows = useMemo(() => [...rows].sort((a, b) => {
    const multiplier = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'name') return a.name.localeCompare(b.name) * multiplier
    return (a[sortKey] - b[sortKey]) * multiplier
  }), [rows, sortDir, sortKey])

  const chartRows = useMemo(() => [...rows].sort((a, b) => b[chartMetric] - a[chartMetric]).slice(0, 10), [rows, chartMetric])
  const chartMax = Math.max(1, ...chartRows.map((r) => r[chartMetric]))

  const totalCasts = relevantEvents.filter((e) => e.event_type === 'casts_recorded').reduce((sum, e) => sum + (e.cast_quantity ?? 0), 0)
  const totalBites = relevantEvents.filter((e) => e.event_type === 'bite').length
  const totalCatches = relevantCatches.length

  function changeSort(next: SortKey) {
    if (sortKey === next) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(next)
      setSortDir(next === 'name' ? 'asc' : 'desc')
    }
  }

  function header(label: string, key: SortKey) {
    const active = sortKey === key
    return <button onClick={() => changeSort(key)} style={{ border: 0, background: 'transparent', color: active ? '#78bfff' : '#c7d7e3', fontWeight: 800, padding: 0, textAlign: key === 'name' ? 'left' : 'right', cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}{active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</button>
  }

  const selectedLake = waterBodies.find((w) => w.id === lakeId)?.name
  const contextLabel = viewMode === 'all' ? 'All fishing history' : viewMode === 'lake' ? selectedLake ?? 'Selected water' : viewMode === 'year' ? year : `${selectedLake ?? 'Selected water'} · ${year}`

  return (
    <div className="page">
      <header className="page-header"><div><p className="eyebrow">PERFORMANCE</p><h1>Insights</h1></div></header>

      <section className="form-card" style={{ marginTop: 0 }}>
        <div className="two-fields">
          <label>View
            <select value={viewMode} onChange={(e) => setViewMode(e.target.value as ViewMode)}>
              <option value="all">Lure ranking — all history</option>
              <option value="lake">Lake success</option>
              <option value="year">Annual success</option>
              <option value="lakeYear">Lake / year success</option>
            </select>
          </label>
          {(viewMode === 'lake' || viewMode === 'lakeYear') && <label>Lake / waterway<select value={lakeId} onChange={(e) => setLakeId(e.target.value)}>{waterBodies.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}
          {(viewMode === 'year' || viewMode === 'lakeYear') && <label>Calendar year<select value={year} onChange={(e) => setYear(e.target.value)}>{years.map((y) => <option key={y}>{y}</option>)}</select></label>}
        </div>
        <small style={{ color: '#91a9ba' }}>Showing: {contextLabel}</small>
      </section>

      <div className="stat-grid">
        <div className="stat-card"><strong>{totalCasts}</strong><span>Casts</span></div>
        <div className="stat-card"><strong>{totalBites}</strong><span>Bites</span></div>
        <div className="stat-card"><strong>{totalCatches}</strong><span>Catches</span></div>
        <div className="stat-card"><strong>{totalCasts ? ((totalCatches / totalCasts) * 100).toFixed(1) : '0.0'}%</strong><span>Catch / cast</span></div>
      </div>

      <section>
        <div className="section-heading"><h2>Lure ranking</h2></div>
        <div style={{ overflowX: 'auto', border: '1px solid #21445d', borderRadius: 14, background: '#0c2538' }}>
          <table style={{ width: '100%', minWidth: 940, borderCollapse: 'collapse', fontSize: '.82rem' }}>
            <thead><tr style={{ borderBottom: '1px solid #31536a' }}>
              <th style={{ padding: 12, textAlign: 'center' }}>Rank</th>
              <th style={{ padding: 12, textAlign: 'left' }}>{header('Lure name', 'name')}</th>
              <th style={{ padding: 12, textAlign: 'right' }}>{header('Casts', 'casts')}</th>
              <th style={{ padding: 12, textAlign: 'right' }}>{header('Bites', 'bites')}</th>
              <th style={{ padding: 12, textAlign: 'right' }}>{header('Catches', 'catches')}</th>
              <th style={{ padding: 12, textAlign: 'right' }}>{header('Bites + catches', 'activity')}</th>
              <th style={{ padding: 12, textAlign: 'right' }}>{header('Bites / casts', 'bitePct')}</th>
              <th style={{ padding: 12, textAlign: 'right' }}>{header('Catches / casts', 'catchPct')}</th>
              <th style={{ padding: 12, textAlign: 'right' }}>{header('(Bites + catches) / casts', 'activityPct')}</th>
            </tr></thead>
            <tbody>{sortedRows.map((row, index) => <tr key={row.lureId} style={{ borderBottom: '1px solid #17374e' }}>
              <td style={{ padding: 11, textAlign: 'center', color: '#77c5ff', fontWeight: 900 }}>{index + 1}</td>
              <td style={{ padding: 11, fontWeight: 800 }}>{row.name}</td>
              <td style={{ padding: 11, textAlign: 'right' }}>{row.casts}</td>
              <td style={{ padding: 11, textAlign: 'right' }}>{row.bites}</td>
              <td style={{ padding: 11, textAlign: 'right' }}>{row.catches}</td>
              <td style={{ padding: 11, textAlign: 'right' }}>{row.activity}</td>
              <td style={{ padding: 11, textAlign: 'right' }}>{row.bitePct.toFixed(1)}%</td>
              <td style={{ padding: 11, textAlign: 'right' }}>{row.catchPct.toFixed(1)}%</td>
              <td style={{ padding: 11, textAlign: 'right' }}>{row.activityPct.toFixed(1)}%</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-heading"><h2>Top lures</h2></div>
        <label style={{ marginBottom: 14 }}>Chart metric<select value={chartMetric} onChange={(e) => setChartMetric(e.target.value as ChartMetric)}>{Object.entries(metricLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <div style={{ width: '100%', border: '1px solid #21445d', borderRadius: 14, background: '#0c2538', padding: '16px 4px 8px', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: 245, display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', gap: 0, alignItems: 'end' }}>
            {chartRows.map((row) => {
              const value = row[chartMetric]
              const height = Math.max(3, (value / chartMax) * 165)
              const label = chartMetric.endsWith('Pct') ? `${value.toFixed(1)}%` : String(value)
              return <div key={row.lureId} style={{ minWidth: 0, height: 225, display: 'grid', gridTemplateRows: '24px 165px 36px', alignItems: 'end', justifyItems: 'stretch', gap: 0 }}>
                <strong style={{ fontSize: '.58rem', textAlign: 'center', color: '#d7e5ee', overflow: 'hidden' }}>{label}</strong>
                <div style={{ height: 165, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', height, minHeight: 3, background: 'linear-gradient(180deg,#55baf7,#347e42)', borderRadius: '3px 3px 0 0' }} />
                </div>
                <small title={row.name} style={{ width: '100%', padding: '3px 1px 0', overflow: 'hidden', textAlign: 'center', color: '#91a9ba', fontSize: '.52rem', lineHeight: 1.05, wordBreak: 'break-word' }}>{row.name.length > 12 ? `${row.name.slice(0, 11)}…` : row.name}</small>
              </div>
            })}
          </div>
        </div>
      </section>

      <p className="insight-note">Percentages use casts as the denominator. A lure with zero casts will show 0%. "Bites + catches" is the sum of logged bite events and landed fish.</p>
    </div>
  )
}
