import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

const InviteSchema = z.object({
  email:     z.string().email(),
  full_name: z.string().min(2).max(100),
  role:      z.enum(['admin', 'project_manager', 'field_supervisor', 'field_technician', 'finance']),
  team_id:   z.string().uuid().nullable().optional(),
  phone:     z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  // Auth check using the caller's session
  const supabase = await createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { email, full_name, role, team_id, phone } = parsed.data

  // Supabase auth admin requires a non-SSR client with the service role key
  const adminClient = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${process.env['NEXT_PUBLIC_APP_URL'] ?? ''}/auth/callback`,
      data: { full_name, role, team_id, phone },
    }
  )

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  const canSeePrices = ['admin', 'project_manager', 'finance'].includes(role)

  // Upsert profile with the correct role and team (the trigger may create a stub profile)
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert(
      {
        id:             inviteData.user.id,
        full_name,
        role,
        team_id:        team_id ?? null,
        phone:          phone ?? null,
        can_see_prices: canSeePrices,
        lang:           'ar',
        is_active:      true,
      },
      { onConflict: 'id' }
    )

  if (profileError) {
    console.error('[invite] profile upsert failed:', profileError.message)
  }

  return NextResponse.json({ success: true, user_id: inviteData.user.id }, { status: 201 })
}
