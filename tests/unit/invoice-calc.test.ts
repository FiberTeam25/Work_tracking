import { describe, it, expect } from 'vitest'
import { calculateInvoiceTotals } from '@ftth/shared'

describe('calculateInvoiceTotals', () => {
  it('calculates correct totals for standard deductions', () => {
    const result = calculateInvoiceTotals(100_000)
    expect(result.subtotal).toBe(100_000)
    expect(result.retentionAmt).toBe(10_000)  // 10%
    expect(result.taxAmt).toBe(1_000)          // 1%
    expect(result.totalDeductions).toBe(11_000)
    expect(result.netPayable).toBe(89_000)
  })

  it('handles zero subtotal', () => {
    const result = calculateInvoiceTotals(0)
    expect(result.retentionAmt).toBe(0)
    expect(result.taxAmt).toBe(0)
    expect(result.netPayable).toBe(0)
  })

  it('handles custom retention and tax percentages', () => {
    const result = calculateInvoiceTotals(200_000, 5, 2)
    expect(result.retentionAmt).toBe(10_000) // 5%
    expect(result.taxAmt).toBe(4_000)         // 2%
    expect(result.netPayable).toBe(186_000)
  })

  it('rounds to 2 decimal places', () => {
    const result = calculateInvoiceTotals(333.33)
    expect(result.retentionAmt).toBe(33.33)   // 10% of 333.33
    expect(result.taxAmt).toBe(3.33)           // 1% of 333.33
  })

  it('prototype scenario: 8 tasks with realistic values', () => {
    // From prototype: subtotal approx 1,247,500 EGP
    const result = calculateInvoiceTotals(1_247_500)
    expect(result.retentionAmt).toBe(124_750)
    expect(result.taxAmt).toBe(12_475)
    expect(result.netPayable).toBe(1_110_275)
  })

  it('totalDeductions equals retentionAmt + taxAmt', () => {
    const result = calculateInvoiceTotals(500_000, 10, 1)
    expect(result.totalDeductions).toBe(result.retentionAmt + result.taxAmt)
    expect(result.netPayable).toBe(result.subtotal - result.totalDeductions)
  })
})
