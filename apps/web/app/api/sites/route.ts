import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sites } = await supabase
    .from('sites')
    .select('id, code, name_ar, name_en, project_id, projects(code)')
    .order('code')

  return NextResponse.json({ sites: sites ?? [] })
}
