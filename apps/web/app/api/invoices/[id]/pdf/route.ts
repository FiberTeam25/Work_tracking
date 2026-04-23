import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { InvoiceDocument, type InvoicePdfData } from '@/lib/pdf/invoice-template'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch invoice + lines
  const { data: inv } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, period_start, period_end, status,
      subtotal, retention_pct, tax_pct, retention_amt, tax_amt, net_payable,
      project:projects(code, name_ar),
      site:sites(code, name_ar),
      created_by_profile:profiles!invoices_created_by_fkey(full_name),
      invoice_lines(
        quantity, unit_price, line_total,
        contract_items(
          code, description_ar, unit,
          contract_groups(code, name_ar)
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const lines = (inv.invoice_lines ?? []).map((l: any) => ({
    code: l.contract_items?.code ?? '',
    description_ar: l.contract_items?.description_ar ?? '',
    unit: l.contract_items?.unit ?? '',
    unit_price: l.unit_price,
    quantity: l.quantity,
    line_total: l.line_total,
    group_code: l.contract_items?.contract_groups?.code ?? '',
    group_name_ar: l.contract_items?.contract_groups?.name_ar ?? '',
  }))

  const pdfData: InvoicePdfData = {
    invoice_number: inv.invoice_number,
    period_start: inv.period_start,
    period_end: inv.period_end,
    status: inv.status,
    project_name_ar: (inv.project as any)?.name_ar ?? '',
    project_code: (inv.project as any)?.code ?? '',
    site_name_ar: (inv.site as any)?.name_ar ?? '',
    site_code: (inv.site as any)?.code ?? '',
    subtotal: inv.subtotal,
    retention_pct: inv.retention_pct,
    retention_amt: inv.retention_amt,
    tax_pct: inv.tax_pct,
    tax_amt: inv.tax_amt,
    net_payable: inv.net_payable,
    created_by: (inv.created_by_profile as any)?.full_name ?? '',
    lines,
  }

  const buffer = await renderToBuffer(
    createElement(InvoiceDocument, { inv: pdfData })
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${inv.invoice_number}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
