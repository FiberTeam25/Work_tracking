import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { InvoiceDetail } from '@/components/invoices/InvoiceDetail'

export const revalidate = 0

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, period_start, period_end, status, notes,
      subtotal, retention_pct, tax_pct, retention_amt, tax_amt, net_payable,
      pdf_url, excel_url, approved_at,
      project:projects(code, name_ar, name_en),
      site:sites(code, name_ar),
      created_by_profile:profiles!invoices_created_by_fkey(full_name),
      approved_by_profile:profiles!invoices_approved_by_fkey(full_name),
      invoice_lines(
        id, quantity, unit_price, line_total, task_count,
        contract_items(
          code, description_ar, description_en, unit,
          contract_groups(code, name_ar)
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (!invoice) notFound()

  // Sort invoice lines by BOQ code
  const sorted = {
    ...invoice,
    invoice_lines: [...(invoice.invoice_lines ?? [])].sort((a, b) =>
      (a.contract_items?.code ?? '').localeCompare(b.contract_items?.code ?? '')
    ),
  }

  return <InvoiceDetail invoice={sorted as any} />
}
