'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { StatusChip } from '@/components/tasks/StatusChip'

interface InvoiceLine {
  id: string
  quantity: number
  unit_price: number
  line_total: number
  task_count: number
  contract_items: {
    code: string
    description_ar: string
    description_en: string
    unit: string
    contract_groups: { code: string; name_ar: string } | null
  } | null
}

interface Invoice {
  id: string
  invoice_number: string
  period_start: string
  period_end: string
  status: string
  subtotal: number
  retention_pct: number
  tax_pct: number
  retention_amt: number
  tax_amt: number
  net_payable: number
  pdf_url: string | null
  excel_url: string | null
  notes: string | null
  project: { code: string; name_ar: string; name_en: string } | null
  site: { code: string; name_ar: string } | null
  created_by_profile: { full_name: string } | null
  approved_by_profile: { full_name: string } | null
  approved_at: string | null
  invoice_lines: InvoiceLine[]
}

const STATUS_NEXT_AR: Record<string, string> = {
  draft: 'رفع للاعتماد',
  pending_approval: 'اعتماد المستخلص',
  approved: 'إصدار المستخلص',
}

export function InvoiceDetail({ invoice }: { invoice: Invoice }) {
  const t = useTranslations('invoice')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formatEGP = (n: number) =>
    new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(n) + ' ج.م'

  const canAdvance = STATUS_NEXT_AR[invoice.status]

  async function advance() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/approve`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      router.refresh()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function reject() {
    if (!confirm('هل أنت متأكد من رفض وحذف هذا المستخلص؟')) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/approve`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      router.push('/invoices')
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function exportFile(type: 'pdf' | 'excel') {
    setExporting(type)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/${type}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoice_number}.${type === 'pdf' ? 'pdf' : 'xlsx'}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) { setError(e.message) }
    finally { setExporting(null) }
  }

  // Group lines by contract group
  const byGroup = new Map<string, { name: string; lines: InvoiceLine[] }>()
  for (const line of invoice.invoice_lines) {
    const g = line.contract_items?.contract_groups
    const key = g?.code ?? '?'
    if (!byGroup.has(key)) byGroup.set(key, { name: g?.name_ar ?? '', lines: [] })
    byGroup.get(key)!.lines.push(line)
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-mono text-accent-2">{invoice.invoice_number}</h1>
            <p className="text-ink-1 text-sm mt-1">
              {invoice.project?.name_ar} — {invoice.site?.name_ar}
            </p>
          </div>
          <StatusChip status={invoice.status as any} />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-ink-2">من</p>
            <p className="text-ink-0 font-medium">{invoice.period_start}</p>
          </div>
          <div>
            <p className="text-ink-2">إلى</p>
            <p className="text-ink-0 font-medium">{invoice.period_end}</p>
          </div>
          <div>
            <p className="text-ink-2">أنشأه</p>
            <p className="text-ink-0">{invoice.created_by_profile?.full_name ?? '—'}</p>
          </div>
          {invoice.approved_by_profile && (
            <div>
              <p className="text-ink-2">اعتمده</p>
              <p className="text-ink-0">{invoice.approved_by_profile.full_name}</p>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-line">
          <button
            className="btn-ghost text-sm"
            onClick={() => exportFile('pdf')}
            disabled={exporting !== null}
          >
            {exporting === 'pdf' ? '...' : '⬇ PDF'}
          </button>
          <button
            className="btn-ghost text-sm"
            onClick={() => exportFile('excel')}
            disabled={exporting !== null}
          >
            {exporting === 'excel' ? '...' : '⬇ Excel'}
          </button>

          <div className="flex-1" />

          {canAdvance && !['issued', 'paid'].includes(invoice.status) && (
            <button
              className="btn-ghost text-sm text-danger"
              onClick={reject}
              disabled={loading}
            >
              رفض / حذف
            </button>
          )}
          {canAdvance && (
            <button
              className="btn-accent text-sm"
              onClick={advance}
              disabled={loading}
            >
              {loading ? '...' : canAdvance}
            </button>
          )}
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}
      </div>

      {/* Line items grouped by BOQ group */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-line">
          <h2 className="font-semibold text-ink-0">{t('lines')}</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-bg-2">
              <th className="px-4 py-2 text-start text-ink-1 font-medium">{t('boqCode')}</th>
              <th className="px-4 py-2 text-start text-ink-1 font-medium">{t('description')}</th>
              <th className="px-4 py-2 text-start text-ink-1 font-medium">{t('unit')}</th>
              <th className="px-4 py-2 text-end text-ink-1 font-medium">{t('qty')}</th>
              <th className="px-4 py-2 text-end text-ink-1 font-medium">{t('unitPrice')}</th>
              <th className="px-4 py-2 text-end text-ink-1 font-medium">{t('amount')}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(byGroup.entries()).map(([groupCode, { name, lines }]) => (
              <>
                <tr key={`g-${groupCode}`} className="bg-bg-1">
                  <td colSpan={6} className="px-4 py-1.5 text-xs font-bold text-ink-1 uppercase tracking-wide">
                    {groupCode} — {name}
                  </td>
                </tr>
                {lines.map((line) => (
                  <tr key={line.id} className="border-b border-line hover:bg-bg-2 transition-colors">
                    <td className="px-4 py-2 font-mono text-accent-2">
                      {line.contract_items?.code}
                    </td>
                    <td className="px-4 py-2 text-ink-0">
                      {line.contract_items?.description_ar}
                    </td>
                    <td className="px-4 py-2 text-ink-1">{line.contract_items?.unit}</td>
                    <td className="px-4 py-2 text-end font-mono">
                      {new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(line.quantity)}
                    </td>
                    <td className="px-4 py-2 text-end font-mono text-ink-1">
                      {new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(line.unit_price)}
                    </td>
                    <td className="px-4 py-2 text-end font-mono font-medium text-ink-0">
                      {formatEGP(line.line_total)}
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals summary */}
      <div className="card p-6 max-w-sm ms-auto space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-1">{t('subtotal')}</span>
          <span className="font-mono text-ink-0">{formatEGP(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between text-danger">
          <span>{t('retention', { pct: invoice.retention_pct })}</span>
          <span className="font-mono">− {formatEGP(invoice.retention_amt)}</span>
        </div>
        <div className="flex justify-between text-danger">
          <span>{t('tax', { pct: invoice.tax_pct })}</span>
          <span className="font-mono">− {formatEGP(invoice.tax_amt)}</span>
        </div>
        <div className="flex justify-between pt-3 border-t border-line text-base font-bold">
          <span className="text-ink-0">{t('netPayable')}</span>
          <span className="font-mono text-success">{formatEGP(invoice.net_payable)}</span>
        </div>
      </div>
    </div>
  )
}
