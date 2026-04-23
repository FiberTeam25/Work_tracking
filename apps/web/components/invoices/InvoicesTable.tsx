'use client'

import { useTranslations } from 'next-intl'
import { StatusChip } from '@/components/tasks/StatusChip'

interface Invoice {
  id: string
  invoice_number: string
  period_start: string
  period_end: string
  status: string
  subtotal: number
  retention_amt: number
  tax_amt: number
  net_payable: number
  pdf_url: string | null
  excel_url: string | null
  created_at: string
  project: { code: string; name_ar: string; name_en: string } | null
  site: { code: string; name_ar: string } | null
  created_by_profile: { full_name: string } | null
}

export function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const t = useTranslations('invoice')
  const tc = useTranslations('common')

  const formatEGP = (n: number) =>
    new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(n) + ' ج.م'

  if (invoices.length === 0) {
    return (
      <div className="card text-center py-16 text-ink-1">
        {t('noInvoices')}
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="px-4 py-3 text-start text-ink-1 font-medium">{t('number')}</th>
            <th className="px-4 py-3 text-start text-ink-1 font-medium">{t('period')}</th>
            <th className="px-4 py-3 text-start text-ink-1 font-medium">{tc('status')}</th>
            <th className="px-4 py-3 text-end text-ink-1 font-medium">{t('subtotal')}</th>
            <th className="px-4 py-3 text-end text-ink-1 font-medium">{t('netPayable')}</th>
            <th className="px-4 py-3 text-start text-ink-1 font-medium">{tc('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-line hover:bg-bg-2 transition-colors">
              <td className="px-4 py-3 font-mono text-accent-2">{inv.invoice_number}</td>
              <td className="px-4 py-3 text-ink-0">
                {inv.period_start} → {inv.period_end}
              </td>
              <td className="px-4 py-3">
                <StatusChip status={inv.status as any} />
              </td>
              <td className="px-4 py-3 text-end font-mono text-ink-0">
                {formatEGP(inv.subtotal)}
              </td>
              <td className="px-4 py-3 text-end font-mono font-bold text-success">
                {formatEGP(inv.net_payable)}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {inv.pdf_url && (
                    <a
                      href={inv.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost text-xs px-2 py-1"
                    >
                      PDF
                    </a>
                  )}
                  {inv.excel_url && (
                    <a
                      href={inv.excel_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost text-xs px-2 py-1"
                    >
                      Excel
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
