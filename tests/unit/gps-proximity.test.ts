import { describe, it, expect } from 'vitest'
import { haversineDistanceM, isWithinProximity } from '@ftth/shared'

// Cairo area coordinates for realistic FTTH testing
const CABINET_A = { lat: 30.0444, lng: 31.2357 }  // Cairo center
const NEARBY    = { lat: 30.0445, lng: 31.2358 }   // ~14m away
const FAR       = { lat: 30.0500, lng: 31.2400 }   // ~740m away
const EXACT     = { lat: 30.0444, lng: 31.2357 }   // same point

describe('haversineDistanceM', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistanceM(CABINET_A, EXACT)).toBe(0)
  })

  it('returns correct distance for nearby points', () => {
    const dist = haversineDistanceM(CABINET_A, NEARBY)
    expect(dist).toBeGreaterThan(10)
    expect(dist).toBeLessThan(20)
  })

  it('returns correct distance for far points', () => {
    const dist = haversineDistanceM(CABINET_A, FAR)
    expect(dist).toBeGreaterThan(700)
    expect(dist).toBeLessThan(800)
  })

  it('is symmetric (A→B equals B→A)', () => {
    const ab = haversineDistanceM(CABINET_A, FAR)
    const ba = haversineDistanceM(FAR, CABINET_A)
    expect(Math.abs(ab - ba)).toBeLessThan(0.01)
  })
})

describe('isWithinProximity', () => {
  it('returns true when technician is within 50m', () => {
    expect(isWithinProximity(NEARBY, CABINET_A, 50)).toBe(true)
  })

  it('returns false when technician is beyond 50m', () => {
    expect(isWithinProximity(FAR, CABINET_A, 50)).toBe(false)
  })

  it('returns true at exact location', () => {
    expect(isWithinProximity(EXACT, CABINET_A, 50)).toBe(true)
  })

  it('uses 50m default threshold when not specified', () => {
    expect(isWithinProximity(NEARBY, CABINET_A)).toBe(true)
    expect(isWithinProximity(FAR, CABINET_A)).toBe(false)
  })

  it('respects custom threshold', () => {
    // NEARBY is ~14m away
    expect(isWithinProximity(NEARBY, CABINET_A, 10)).toBe(false) // 10m threshold → outside
    expect(isWithinProximity(NEARBY, CABINET_A, 20)).toBe(true)  // 20m threshold → inside
  })
})
