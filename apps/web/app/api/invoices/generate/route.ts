import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { calculateInvoiceTotals } from '@ftth/shared'

const GenerateSchema = z.object({
  site_id: z.string().uuid(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  retention_pct: z.number().min(0).max(100).default(10),
  tax_pct: z.number().min(0).max(100).default(1),
})

export async function POST(request: NextRequest) {
  // Verify session via user-scoped client
  const userSupabase = await createServerClient()
  const { data: { user } } = await userSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await userSupabase
    .from('profiles')
    .select('role, id')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'project_manager', 'finance'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { site_id, period_start, period_end, retention_pct, tax_pct } = parsed.data

  // Use service role for writes so RLS doesn't block
  const supabase = await createServiceRoleClient()

  // Validate site exists
  const { data: site } = await supabase
    .from('sites')
    .select('id, project_id, name_ar, name_en')
    .eq('id', site_id)
    .single()
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  // Fetch all approved, un-invoiced tasks in the period for this site
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select(`
      id, task_type, route_length_m, quantity, line_total,
      contract_items(id, code, description_ar, description_en, unit, unit_price, group_id,
        contract_groups(code, name_ar))
    `)
    .eq('site_id', site_id)
    .eq('status', 'approved')
    .gte('task_date', period_start)
    .lte('task_date', period_end)
    .is('invoice_id', null)

  if (tasksError) return NextResponse.json({ error: tasksError.message }, { status: 500 })
  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ error: 'No approved tasks found for this period' }, { status: 400 })
  }

  // Aggregate by contract_item_id → one line per BOQ code
  type LineAgg = {
    contract_item_id: string
    code: string
    description_ar: string
    description_en: string
    unit: string
    unit_price: number
    quantity: number
    line_total: number
    task_count: number
    group_code: string
    group_name_ar: string
  }

  const lineMap = new Map<string, LineAgg>()

  for (const task of tasks) {
    const ci = task.contract_items as any
    if (!ci) continue

    const existing = lineMap.get(ci.id)
    const taskQty =
      task.task_type === 'route'
        ? (task.route_length_m ?? 0)
        : (task.quantity ?? 0)
    const taskTotal = task.line_total ?? 0

    if (existing) {
      existing.quantity += taskQty
      existing.line_total += taskTotal
      existing.task_count += 1
    } else {
      lineMap.set(ci.id, {
        contract_item_id: ci.id,
        code: ci.code,
        description_ar: ci.description_ar,
        description_en: ci.description_en,
        unit: ci.unit,
        unit_price: ci.unit_price ?? 0,
        quantity: taskQty,
        line_total: taskTotal,
        task_count: 1,
        group_code: ci.contract_groups?.code ?? '',
        group_name_ar: ci.contract_groups?.name_ar ?? '',
      })
    }
  }

  const lines = Array.from(lineMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code)
  )
  const subtotal = Math.round(lines.reduce((s, l) => s + l.line_total, 0) * 100) / 100
  const totals = calculateInvoiceTotals(subtotal, retention_pct, tax_pct)

  // Generate sequential invoice number within this project
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', site.project_id)

  const year = new Date().getFullYear()
  const seq = String((count ?? 0) + 1).padStart(3, '0')
  const invoiceNumber = `INV-${year}-${seq}`

  // Create invoice record
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      project_id: site.project_id,
      site_id,
      invoice_number: invoiceNumber,
      period_start,
      period_end,
      status: 'draft',
      subtotal,
      retention_pct,
      tax_pct,
      created_by: profile.id,
    })
    .select()
    .single()

  if (invErr || !invoice) {
    return NextResponse.json({ error: invErr?.message ?? 'Failed to create invoice' }, { status: 500 })
  }

  // Insert invoice line items
  const { error: linesErr } = await supabase.from('invoice_lines').insert(
    lines.map((l) => ({
      invoice_id: invoice.id,
      contract_item_id: l.contract_item_id,
      quantity: Math.round(l.quantity * 100) / 100,
      unit_price: l.unit_price,
      task_count: l.task_count,
    }))
  )

  if (linesErr) {
    // Roll back the invoice if lines failed
    await supabase.from('invoices').delete().eq('id', invoice.id)
    return NextResponse.json({ error: linesErr.message }, { status: 500 })
  }

  // Mark tasks as invoiced
  await supabase
    .from('tasks')
    .update({ status: 'invoiced', invoice_id: invoice.id })
    .in('id', tasks.map((t) => t.id))

  return NextResponse.json({
    invoice_id: invoice.id,
    invoice_number: invoiceNumber,
    lines,
    totals,
  })
}
