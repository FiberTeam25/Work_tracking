import { describe, it, expect } from 'vitest'
import { formatNumber, formatEGP, formatMeters, formatDateAr, formatDateEn } from '@ftth/shared'

describe('formatNumber', () => {
  it('formats integer with Arabic locale', () => {
    expect(formatNumber(1000)).toBe('١٬٠٠٠')
  })

  it('formats decimal numbers', () => {
    const result = formatNumber(1234.56)
    expect(result).toContain('١٬٢٣٤')
  })

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('٠')
  })
})

describe('formatEGP', () => {
  it('formats currency with EGP suffix', () => {
    const result = formatEGP(89000)
    expect(result).toContain('ج.م')
    expect(result).toContain('٨٩٬٠٠٠')
  })

  it('includes 2 decimal places', () => {
    const result = formatEGP(1000.5)
    expect(result).toContain('٥٠')
  })
})

describe('formatMeters', () => {
  it('formats with meter suffix', () => {
    const result = formatMeters(1500)
    expect(result).toContain('م')
    expect(result).toContain('١٬٥٠٠')
  })
})

describe('formatDateAr', () => {
  it('formats date in Arabic locale', () => {
    const result = formatDateAr('2026-01-15')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})

describe('formatDateEn', () => {
  it('formats date in English locale', () => {
    const result = formatDateEn('2026-01-15')
    expect(result).toContain('2026')
  })
})
