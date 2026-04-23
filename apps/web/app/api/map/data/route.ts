import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const supabase = await createServerClient()

  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('project_id', projectId)
    .limit(1)
    .maybeSingle()

  if (!site) {
    return NextResponse.json({ cabinets: [], boxes: [], routes: [] })
  }

  const { data, error } = await supabase.rpc('get_map_data', { p_site_id: site.id })

  if (error) {
    console.error('[map/data] get_map_data error:', error.message)
    return NextResponse.json({ cabinets: [], boxes: [], routes: [] })
  }

  return NextResponse.json(data ?? { cabinets: [], boxes: [], routes: [] })
}
