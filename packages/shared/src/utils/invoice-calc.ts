export interface InvoiceTotals {
  subtotal: number
  retentionAmt: number
  taxAmt: number
  totalDeductions: number
  netPayable: number
}

/**
 * Calculates invoice deductions and net payable amount.
 * Used by both web (invoice generator) and mobile (task value preview).
 * Retention = تأمين نهائي, Tax = ضريبة خصم
 */
export function calculateInvoiceTotals(
  subtotal: number,
  retentionPct: number = 10,
  taxPct: number = 1
): InvoiceTotals {
  const retentionAmt = round2(subtotal * (retentionPct / 100))
  const taxAmt = round2(subtotal * (taxPct / 100))
  const totalDeductions = round2(retentionAmt + taxAmt)
  const netPayable = round2(subtotal - totalDeductions)

  return { subtotal, retentionAmt, taxAmt, totalDeductions, netPayable }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
