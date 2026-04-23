import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateTeamSchema = z.object({
  name:          z.string().min(2).max(100),
  code:          z.string().min(2).max(20).toUpperCase(),
  supervisor_id: z.string().uuid().nullable().optional(),
  project_id:    z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'project_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = CreateTeamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('teams')
    .insert({
      name:          parsed.data.name,
      code:          parsed.data.code,
      supervisor_id: parsed.data.supervisor_id ?? null,
      project_id:    parsed.data.project_id ?? null,
      is_active:     true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
