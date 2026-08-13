import { describe, expect, it } from 'vitest'
import { conversionRate, fishPerHour, per100, recommendationConfidence } from './analytics'
import type { LurePerformance } from '../types/domain'

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
