import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

serve(async (req) => {
  const { invoiceId, lang = 'ar' } = await req.json()

  if (!invoiceId) {
    return new Response(JSON.stringify({ error: 'invoiceId required' }), { status: 400 })
  }

  // Fetch invoice with lines and project info
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      project:projects(code, name_ar, name_en),
      site:sites(code, name_ar, name_en),
      lines:invoice_lines(
        quantity, unit_price, line_total, task_count,
        contract_item:contract_items(code, description_ar, description_en, unit)
      )
    `)
    .eq('id', invoiceId)
    .single()

  if (error || !invoice) {
    return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404 })
  }

  // Build HTML for PDF (Arabic RTL invoice matching prototype layout)
  const isAr = lang === 'ar'
  const html = buildInvoiceHtml(invoice, isAr)

  // Note: In production, use a headless browser or @react-pdf/renderer via Next.js API route
  // This Edge Function returns the invoice data for the web app to render
  return new Response(JSON.stringify({
    invoice,
    html,
    filename: `${invoice.invoice_number}-${lang}.pdf`,
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})

function buildInvoiceHtml(invoice: any, isAr: boolean): string {
  const dir = isAr ? 'rtl' : 'ltr'
  const currency = (n: number) => `${n.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`

  const lines = invoice.lines.map((line: any) => `
    <tr>
      <td>${line.contract_item?.code}</td>
      <td>${isAr ? line.contract_item?.description_ar : line.contract_item?.description_en}</td>
      <td>${line.contract_item?.unit}</td>
      <td>${line.quantity.toLocaleString('ar-EG')}</td>
      <td>${line.unit_price.toLocaleString('ar-EG')}</td>
      <td>${currency(line.line_total)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: ${dir}; color: #1a2332; }
    .header { background: #0a0e14; color: #f8fafc; padding: 24px; }
    .title { font-size: 24px; font-weight: bold; color: #ff7a1a; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #111827; color: #94a3b8; padding: 10px; text-align: ${isAr ? 'right' : 'left'}; }
    td { padding: 10px; border-bottom: 1px solid #1e293b; }
    .totals { background: #111827; padding: 16px; border-radius: 8px; }
    .net { font-size: 20px; color: #32d583; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${isAr ? 'مستخلص مالي' : 'Invoice'} — ${invoice.invoice_number}</div>
    <div>${isAr ? invoice.project?.name_ar : invoice.project?.name_en}</div>
    <div>${invoice.period_start} → ${invoice.period_end}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>${isAr ? 'الكود' : 'Code'}</th>
        <th>${isAr ? 'الوصف' : 'Description'}</th>
        <th>${isAr ? 'الوحدة' : 'Unit'}</th>
        <th>${isAr ? 'الكمية' : 'Qty'}</th>
        <th>${isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
        <th>${isAr ? 'المبلغ' : 'Amount'}</th>
      </tr>
    </thead>
    <tbody>${lines}</tbody>
  </table>
  <div class="totals">
    <p>${isAr ? 'المجموع الفرعي' : 'Subtotal'}: ${currency(invoice.subtotal)}</p>
    <p>${isAr ? `خصم ضمان ${invoice.retention_pct}%` : `Retention ${invoice.retention_pct}%`}: (${currency(invoice.retention_amt)})</p>
    <p>${isAr ? `ضريبة ${invoice.tax_pct}%` : `Tax ${invoice.tax_pct}%`}: (${currency(invoice.tax_amt)})</p>
    <p class="net">${isAr ? 'صافي المستحق' : 'Net Payable'}: ${currency(invoice.net_payable)}</p>
  </div>
</body>
</html>`
}
