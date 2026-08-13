import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { endTrip, markSpot, recordQuickEvent } from '../services/dataService'
import { activeStats } from '../utils/analytics'
import { formatDuration } from '../utils/format'

type Flash = { text: string; tone?: 'ok' | 'warn' } | null

export default function ActiveFishingPage() {
  const navigate = useNavigate()
  const { activeTrip, events, catches, refresh, refreshActive } = useAppData()
  const [localEvents, setLocalEvents] = useState(events)
  const [flash, setFlash] = useState<Flash>(null)
  const [busy, setBusy] = useState(false)
  const [showEnd, setShowEnd] = useState(false)

  useEffect(() => setLocalEvents(events), [events])
  useEffect(() => {
    if (!activeTrip) navigate('/start', { replace: true })
  }, [activeTrip, navigate])

  const tripEvents = useMemo(
    () => localEvents.filter((e) => e.trip_id === activeTrip?.id),
    [localEvents, activeTrip?.id],
  )
  const tripCatches = useMemo(
    () => catches.filter((c) => c.trip_id === activeTrip?.id),
    [catches, activeTrip?.id],
  )
  const stats = activeStats(tripEvents, tripCatches)
  const rate = activeTrip
    ? stats.fish / Math.max(1 / 60, (Date.now() - new Date(activeTrip.started_at).getTime()) / 3_600_000)
    : 0

  function notify(text: string, tone: 'ok' | 'warn' = 'ok') {
    setFlash({ text, tone })
    window.setTimeout(() => setFlash(null), 2600)
  }

  async function quick(type: 'casts_recorded' | 'bite' | 'hooked' | 'fish_lost', castQuantity?: number) {
    if (!activeTrip || busy) return
    setBusy(true)
    try {
      const event = await recordQuickEvent({ trip: activeTrip, type, castQuantity })
      setLocalEvents((rows) => [...rows, event])
      notify(
        type === 'casts_recorded'
          ? `${castQuantity ?? 1} cast${(castQuantity ?? 1) === 1 ? '' : 's'} logged`
          : type === 'bite'
            ? 'Bite logged'
            : type === 'hooked'
              ? 'Hooked fish logged'
              : 'Lost fish logged',
      )
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not log that event.', 'warn')
    } finally {
      setBusy(false)
    }
  }

  async function saveSpot() {
    if (!activeTrip || busy) return
    setBusy(true)
    try {
      const spot = await markSpot({ trip: activeTrip })
      if (spot) notify('Spot saved')
      else notify('Location is unavailable right now.', 'warn')
      await refreshActive()
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not mark that spot.', 'warn')
    } finally {
      setBusy(false)
    }
  }

  async function finishTrip() {
    if (!activeTrip || busy) return
    setBusy(true)
    try {
      await endTrip(activeTrip)
      await refresh()
      navigate(`/trips/${activeTrip.id}`, { replace: true })
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not end the trip.', 'warn')
    } finally {
      setBusy(false)
      setShowEnd(false)
    }
  }

  if (!activeTrip) return null

  return (
    <div className="active-page">
      <header className="active-header">
        <button className="text-button compact" onClick={() => navigate('/')}>Home</button>
        <div>
          <h1>{activeTrip.water_body?.name ?? 'Fishing'}</h1>
          <p>{formatDuration(activeTrip.started_at)} · {activeTrip.target_species?.common_name ?? 'No target species'}</p>
        </div>
        <button className="icon-button" onClick={() => setShowEnd(true)} aria-label="Trip menu">⋯</button>
      </header>

      <div className="live-scoreboard">
        <div><strong>{stats.casts}</strong><span>Casts</span></div>
        <div><strong>{stats.bites}</strong><span>Bites</span></div>
        <div><strong>{stats.fish}</strong><span>Fish</span></div>
        <div><strong>{rate.toFixed(1)}</strong><span>Fish/hr</span></div>
      </div>

      <button className="current-lure-card" onClick={() => navigate('/change-lure')}>
        <span>
          <small>CURRENT LURE</small>
          <strong>{activeTrip.current_lure?.product_name ?? 'Choose a lure'}</strong>
          <em>{activeTrip.current_lure?.primary_colour ?? 'Tap to change'}</em>
        </span>
        <span>CHANGE ›</span>
      </button>

      <div className="active-actions">
        <button className="cast-button" disabled={busy} onClick={() => void quick('casts_recorded', 1)}>
          <strong>+ CAST</strong>
          <span>Tap for +1</span>
        </button>

        <div className="batch-row" aria-label="Batch cast entry">
          {[5, 10, 25].map((quantity) => (
            <button key={quantity} disabled={busy} onClick={() => void quick('casts_recorded', quantity)}>+{quantity}</button>
          ))}
        </div>

        <div className="action-grid">
          <button className="action-button bite" disabled={busy} onClick={() => void quick('bite')}>
            <span className="big-icon">◌</span><strong>BITE</strong>
          </button>
          <button className="action-button caught" disabled={busy} onClick={() => navigate('/catch')}>
            <span className="big-icon">◆</span><strong>CAUGHT</strong>
          </button>
          <button className="action-button lost" disabled={busy} onClick={() => void quick('fish_lost')}>
            <span className="big-icon">×</span><strong>LOST</strong>
          </button>
          <button className="action-button spot" disabled={busy} onClick={() => void saveSpot()}>
            <span className="big-icon">⌖</span><strong>MARK SPOT</strong>
          </button>
        </div>
      </div>

      {flash && <div className={`toast ${flash.tone === 'warn' ? 'warn' : ''}`}>{flash.text}</div>}

      {showEnd && (
        <div className="modal-backdrop" onClick={() => setShowEnd(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>End fishing trip?</h2>
            <p>{activeTrip.water_body?.name}</p>
            <div className="mini-stats">
              <span><strong>{formatDuration(activeTrip.started_at)}</strong>Time</span>
              <span><strong>{stats.casts}</strong>Casts</span>
              <span><strong>{stats.bites}</strong>Bites</span>
              <span><strong>{stats.fish}</strong>Fish</span>
            </div>
            <button className="danger-button" disabled={busy} onClick={() => void finishTrip()}>
              {busy ? 'Ending…' : 'End Trip'}
            </button>
            <button className="text-button" onClick={() => setShowEnd(false)}>Keep Fishing</button>
          </div>
        </div>
      )}
    </div>
  )
}
