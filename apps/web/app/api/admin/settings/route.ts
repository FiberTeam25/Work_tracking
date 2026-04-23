import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SettingsSchema = z.object({
  project_id:    z.string().uuid(),
  retention_pct: z.number().min(0).max(50),
  tax_pct:       z.number().min(0).max(30),
})

export async function PATCH(request: NextRequest) {
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
  const parsed = SettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Fetch current metadata, merge changes
  const { data: project } = await supabase
    .from('projects')
    .select('metadata')
    .eq('id', parsed.data.project_id)
    .single()

  const metadata = {
    ...((project?.metadata as Record<string, unknown>) ?? {}),
    retention_pct: parsed.data.retention_pct,
    tax_pct:       parsed.data.tax_pct,
  }

  const { error } = await supabase
    .from('projects')
    .update({ metadata })
    .eq('id', parsed.data.project_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, metadata })
}
