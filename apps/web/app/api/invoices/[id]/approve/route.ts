import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

// Valid status transitions
const TRANSITIONS: Record<string, string> = {
  draft: 'pending_approval',
  pending_approval: 'approved',
  approved: 'issued',
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const supabase = await createServiceRoleClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', params.id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const nextStatus = TRANSITIONS[invoice.status]
  if (!nextStatus) {
    return NextResponse.json({ error: `Cannot advance from status: ${invoice.status}` }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('invoices')
    .update({
      status: nextStatus,
      ...(nextStatus === 'approved' ? { approved_by: profile.id, approved_at: new Date().toISOString() } : {}),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invoice: updated })
}

// Reject / revert to draft
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userSupabase = await createServerClient()
  const { data: { user } } = await userSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'project_manager', 'finance'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createServiceRoleClient()

  // Revert tasks back to approved so they can be re-invoiced
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', params.id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (invoice.status === 'issued' || invoice.status === 'paid') {
    return NextResponse.json({ error: 'Cannot reject an issued or paid invoice' }, { status: 400 })
  }

  await supabase
    .from('tasks')
    .update({ status: 'approved', invoice_id: null })
    .eq('invoice_id', params.id)

  await supabase.from('invoices').delete().eq('id', params.id)

  return NextResponse.json({ success: true })
}
