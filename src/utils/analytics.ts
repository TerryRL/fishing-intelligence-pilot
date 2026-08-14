import type {
  CatchRecord,
  FishingEvent,
  FishingTrip,
  Lure,
  LurePerformance,
  Recommendation,
} from '../types/domain'
import { round } from './format'

export interface LureRankingRow {
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

export function fishPerHour(fish: number, minutes: number): number {
  if (minutes <= 0) return 0
  return round(fish / (minutes / 60), 2)
}

export function per100(count: number, casts: number): number | null {
  if (casts <= 0) return null
  return round((count / casts) * 100, 2)
}

export function conversionRate(success: number, attempts: number): number | null {
  if (attempts <= 0) return null
  return round((success / attempts) * 100, 1)
}

export function interactionCount(bites: number, catches: number): number {
  return bites + catches
}

export function landingConversion(bites: number, catches: number): number | null {
  return conversionRate(catches, interactionCount(bites, catches))
}

export function buildLureRanking(
  events: FishingEvent[],
  catches: CatchRecord[],
  lures: Lure[],
): LureRankingRow[] {
  return lures.map((lure) => {
    const lureEvents = events.filter((event) => event.lure_id === lure.id)
    const casts = lureEvents
      .filter((event) => event.event_type === 'casts_recorded')
      .reduce((sum, event) => sum + (event.cast_quantity ?? 0), 0)
    const bites = lureEvents.filter((event) => event.event_type === 'bite').length
    const landed = catches.filter((catchRow) => catchRow.lure_id === lure.id).length
    const activity = interactionCount(bites, landed)

    return {
      lureId: lure.id,
      name: lure.product_name,
      casts,
      bites,
      catches: landed,
      activity,
      bitePct: casts > 0 ? (bites / casts) * 100 : 0,
      catchPct: casts > 0 ? (landed / casts) * 100 : 0,
      activityPct: casts > 0 ? (activity / casts) * 100 : 0,
    }
  })
}

function lureMinutesForTrip(
  trip: FishingTrip,
  events: FishingEvent[],
): Map<string, number> {
  const map = new Map<string, number>()
  const setupEvents = events
    .filter((event) => event.trip_id === trip.id && event.event_type === 'setup_selected' && event.lure_id)
    .sort((a, b) => a.event_time.localeCompare(b.event_time))

  if (!setupEvents.length) return map

  for (let i = 0; i < setupEvents.length; i += 1) {
    const current = setupEvents[i]
    const next = setupEvents[i + 1]
    const end = next?.event_time ?? trip.ended_at ?? new Date().toISOString()
    const minutes = Math.max(
      0,
      (new Date(end).getTime() - new Date(current.event_time).getTime()) / 60_000,
    )
    const lureId = current.lure_id as string
    map.set(lureId, (map.get(lureId) ?? 0) + minutes)
  }
  return map
}

export function buildLurePerformance(
  trips: FishingTrip[],
  events: FishingEvent[],
  catches: CatchRecord[],
  lures: Lure[],
): LurePerformance[] {
  const validTripIds = new Set(trips.map((trip) => trip.id))
  const byLure = new Map<string, {
    minutes: number
    casts: number
    bites: number
    fish: number
    tripIds: Set<string>
  }>()

  const ensure = (lureId: string) => {
    if (!byLure.has(lureId)) {
      byLure.set(lureId, { minutes: 0, casts: 0, bites: 0, fish: 0, tripIds: new Set() })
    }
    return byLure.get(lureId)!
  }

  for (const trip of trips) {
    const minutes = lureMinutesForTrip(trip, events)
    for (const [lureId, value] of minutes.entries()) {
      const row = ensure(lureId)
      row.minutes += value
      row.tripIds.add(trip.id)
    }
  }

  for (const event of events) {
    if (!validTripIds.has(event.trip_id) || !event.lure_id) continue
    const row = ensure(event.lure_id)
    row.tripIds.add(event.trip_id)
    if (event.event_type === 'casts_recorded') row.casts += event.cast_quantity ?? 0
    if (event.event_type === 'bite') row.bites += 1
  }

  for (const catchRow of catches) {
    if (!validTripIds.has(catchRow.trip_id) || !catchRow.lure_id) continue
    const row = ensure(catchRow.lure_id)
    row.fish += 1
    row.tripIds.add(catchRow.trip_id)
  }

  const lureMap = new Map(lures.map((lure) => [lure.id, lure]))

  return [...byLure.entries()]
    .map(([lureId, row]) => {
      const lure = lureMap.get(lureId)
      return {
        lureId,
        lureName: lure?.product_name ?? 'Historical lure',
        colour: lure?.primary_colour ?? 'Unknown',
        minutesUsed: round(row.minutes, 1),
        casts: row.casts,
        bites: row.bites,
        fish: row.fish,
        fishPerHour: fishPerHour(row.fish, row.minutes),
        bitesPerHour: fishPerHour(row.bites, row.minutes),
        fishPer100Casts: per100(row.fish, row.casts),
        bitesPer100Casts: per100(row.bites, row.casts),
        trips: row.tripIds.size,
      }
    })
    .sort((a, b) => b.fishPerHour - a.fishPerHour || b.fish - a.fish)
}

export function recommendationConfidence(row: LurePerformance): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (row.trips >= 6 && (row.casts >= 150 || row.minutesUsed >= 240)) return 'HIGH'
  if (row.trips >= 3 && (row.casts >= 60 || row.minutesUsed >= 90)) return 'MEDIUM'
  return 'LOW'
}

export function buildRecommendations(rows: LurePerformance[]): Recommendation[] {
  if (!rows.length) return []

  const maxFishHr = Math.max(...rows.map((r) => r.fishPerHour), 1)
  const maxFish100 = Math.max(...rows.map((r) => r.fishPer100Casts ?? 0), 1)

  return rows
    .map((row) => {
      const sample = Math.min(1, (row.trips / 5 + row.casts / 200 + row.minutesUsed / 300) / 3)
      const rateScore = row.fishPerHour / maxFishHr
      const castScore = row.fishPer100Casts === null ? rateScore : row.fishPer100Casts / maxFish100
      const score = round((rateScore * 0.5 + castScore * 0.3 + sample * 0.2) * 100, 1)
      const confidence = recommendationConfidence(row)
      const reason =
        row.fish === 0
          ? 'You have useful exposure data, but no landed fish on this lure yet.'
          : `${row.fish} landed fish across ${row.trips} trip${row.trips === 1 ? '' : 's'}, with ${row.fishPerHour} fish/hour.`
      return { ...row, score, confidence, reason }
    })
    .sort((a, b) => b.score - a.score)
}

export function activeStats(events: FishingEvent[], catches: CatchRecord[]) {
  return {
    casts: events
      .filter((e) => e.event_type === 'casts_recorded')
      .reduce((sum, e) => sum + (e.cast_quantity ?? 0), 0),
    bites: events.filter((e) => e.event_type === 'bite').length,
    hooked: events.filter((e) => e.event_type === 'hooked').length,
    lost: events.filter((e) => e.event_type === 'fish_lost').length,
    fish: catches.length,
  }
}
