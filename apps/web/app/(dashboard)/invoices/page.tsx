import { createServerClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { InvoicesTable } from '@/components/invoices/InvoicesTable'
import { GenerateInvoiceButton } from '@/components/invoices/GenerateInvoiceButton'

export const revalidate = 0

export default async function InvoicesPage() {
  const t = await getTranslations('invoice')
  const supabase = await createServerClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, period_start, period_end, status,
      subtotal, retention_amt, tax_amt, net_payable,
      pdf_url, excel_url, created_at,
      project:projects(code, name_ar, name_en),
      site:sites(code, name_ar),
      created_by_profile:profiles!invoices_created_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-0">{t('title')}</h1>
        <GenerateInvoiceButton />
      </div>
      <InvoicesTable invoices={invoices ?? []} />
    </div>
  )
}
