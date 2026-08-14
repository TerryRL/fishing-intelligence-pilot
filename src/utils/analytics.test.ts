import { describe, expect, it } from 'vitest'
import {
  buildLurePerformance,
  buildLureRanking,
  conversionRate,
  fishPerHour,
  interactionCount,
  landingConversion,
  per100,
  recommendationConfidence,
} from './analytics'
import type { CatchRecord, FishingEvent, FishingTrip, Lure, LurePerformance } from '../types/domain'

describe('analytics helpers', () => {
  it('calculates fish per hour', () => {
    expect(fishPerHour(5, 120)).toBe(2.5)
    expect(fishPerHour(5, 0)).toBe(0)
  })

  it('calculates rate per 100 casts safely', () => {
    expect(per100(4, 80)).toBe(5)
    expect(per100(4, 0)).toBeNull()
  })

  it('calculates conversion safely', () => {
    expect(conversionRate(6, 10)).toBe(60)
    expect(conversionRate(0, 0)).toBeNull()
  })

  it('adds bites and catches exactly', () => {
    expect(interactionCount(3, 3)).toBe(6)
    expect(interactionCount(2, 2)).toBe(4)
  })

  it('calculates landed conversion from all strike outcomes', () => {
    expect(landingConversion(3, 3)).toBe(50)
    expect(landingConversion(2, 3)).toBe(60)
    expect(landingConversion(0, 0)).toBeNull()
  })

  it('builds lure ranking with consistent counts and percentages', () => {
    const lures = [
      { id: 'a', product_name: 'Lure A' },
      { id: 'b', product_name: 'Lure B' },
    ] as unknown as Lure[]
    const events = [
      { lure_id: 'a', event_type: 'casts_recorded', cast_quantity: 20 },
      { lure_id: 'a', event_type: 'bite' },
      { lure_id: 'a', event_type: 'bite' },
      { lure_id: 'a', event_type: 'bite' },
      { lure_id: 'b', event_type: 'casts_recorded', cast_quantity: 10 },
      { lure_id: 'b', event_type: 'bite' },
      { lure_id: 'b', event_type: 'bite' },
    ] as unknown as FishingEvent[]
    const catches = [
      { lure_id: 'a' }, { lure_id: 'a' }, { lure_id: 'a' },
      { lure_id: 'b' }, { lure_id: 'b' },
    ] as unknown as CatchRecord[]

    const rows = buildLureRanking(events, catches, lures)
    const a = rows.find((row) => row.lureId === 'a')!
    const b = rows.find((row) => row.lureId === 'b')!

    expect(a.bites).toBe(3)
    expect(a.catches).toBe(3)
    expect(a.activity).toBe(6)
    expect(a.bitePct).toBe(15)
    expect(a.catchPct).toBe(15)
    expect(a.activityPct).toBe(30)

    expect(b.bites).toBe(2)
    expect(b.catches).toBe(2)
    expect(b.activity).toBe(4)
    expect(b.bitePct).toBe(20)
    expect(b.catchPct).toBe(20)
    expect(b.activityPct).toBe(40)
  })

  it('excludes events and catches from trips outside the requested trip set', () => {
    const trips = [{ id: 'completed', ended_at: '2026-08-14T02:00:00Z' }] as unknown as FishingTrip[]
    const events = [
      { trip_id: 'completed', lure_id: 'a', event_type: 'setup_selected', event_time: '2026-08-14T01:00:00Z' },
      { trip_id: 'completed', lure_id: 'a', event_type: 'casts_recorded', cast_quantity: 10 },
      { trip_id: 'active', lure_id: 'a', event_type: 'casts_recorded', cast_quantity: 90 },
      { trip_id: 'active', lure_id: 'a', event_type: 'bite' },
    ] as unknown as FishingEvent[]
    const catches = [
      { trip_id: 'completed', lure_id: 'a' },
      { trip_id: 'active', lure_id: 'a' },
      { trip_id: 'active', lure_id: 'a' },
    ] as unknown as CatchRecord[]
    const lures = [{ id: 'a', product_name: 'Lure A', primary_colour: 'Green' }] as unknown as Lure[]

    const row = buildLurePerformance(trips, events, catches, lures)[0]
    expect(row.casts).toBe(10)
    expect(row.bites).toBe(0)
    expect(row.fish).toBe(1)
  })

  it('requires enough exposure for high confidence', () => {
    const base: LurePerformance = {
      lureId: '1',
      lureName: 'Test lure',
      colour: 'Green Pumpkin',
      minutesUsed: 300,
      casts: 180,
      bites: 20,
      fish: 12,
      fishPerHour: 2.4,
      bitesPerHour: 4,
      fishPer100Casts: 6.67,
      bitesPer100Casts: 11.11,
      trips: 7,
    }
    expect(recommendationConfidence(base)).toBe('HIGH')
    expect(recommendationConfidence({ ...base, trips: 1, casts: 25, minutesUsed: 30 })).toBe('LOW')
  })
})
