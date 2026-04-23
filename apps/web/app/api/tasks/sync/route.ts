import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SyncTaskSchema = z.object({
  client_id: z.string().uuid(),
  project_id: z.string().uuid(),
  site_id: z.string().uuid(),
  contract_item_id: z.string().uuid(),
  team_id: z.string().uuid(),
  task_date: z.string(),
  task_type: z.enum(['route', 'node']),
  // Route fields
  from_cabinet_id: z.string().uuid().optional().nullable(),
  to_box_id: z.string().uuid().optional().nullable(),
  route_length_m: z.number().positive().optional().nullable(),
  // Node fields
  node_cabinet_id: z.string().uuid().optional().nullable(),
  node_box_id: z.string().uuid().optional().nullable(),
  quantity: z.number().positive().optional().nullable(),
  // GPS
  gps_lat: z.number().optional().nullable(),
  gps_lng: z.number().optional().nullable(),
  gps_accuracy_m: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const SyncRequestSchema = z.object({
  tasks: z.array(SyncTaskSchema).max(100),
  last_synced_at: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createServiceRoleClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, team_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await request.json()
  const parsed = SyncRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { tasks, last_synced_at } = parsed.data
  const results: { client_id: string; server_id: string; status: string }[] = []

  for (const task of tasks) {
    // Build GPS point if provided
    const gpsPoint =
      task.gps_lat != null && task.gps_lng != null
        ? `SRID=4326;POINT(${task.gps_lng} ${task.gps_lat})`
        : null

    // Get unit_price from contract_items
    const { data: contractItem } = await supabase
      .from('contract_items')
      .select('unit_price')
      .eq('id', task.contract_item_id)
      .single()

    const { data: upserted, error } = await supabase
      .from('tasks')
      .upsert(
        {
          client_id: task.client_id,
          project_id: task.project_id,
          site_id: task.site_id,
          contract_item_id: task.contract_item_id,
          team_id: task.team_id,
          technician_id: profile.id,
          task_date: task.task_date,
          task_type: task.task_type,
          status: 'pending',
          from_cabinet_id: task.from_cabinet_id,
          to_box_id: task.to_box_id,
          route_length_m: task.route_length_m,
          node_cabinet_id: task.node_cabinet_id,
          node_box_id: task.node_box_id,
          quantity: task.quantity,
          unit_price: contractItem?.unit_price,
          gps_location: gpsPoint,
          gps_accuracy_m: task.gps_accuracy_m,
          notes: task.notes,
          submitted_at: new Date().toISOString(),
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'client_id', ignoreDuplicates: false }
      )
      .select('id, status')
      .single()

    if (error) {
      results.push({ client_id: task.client_id, server_id: '', status: 'error' })
    } else {
      results.push({ client_id: task.client_id, server_id: upserted.id, status: upserted.status })
    }
  }

  // Pull changes since last sync for this team's scope
  let pullQuery = supabase
    .from('tasks')
    .select('id, client_id, status, reviewed_at, line_total')
    .eq('team_id', profile.team_id!)

  if (last_synced_at) {
    pullQuery = pullQuery.gt('updated_at', last_synced_at)
  }

  const { data: updatedTasks } = await pullQuery.limit(200)

  return NextResponse.json({
    pushed: results,
    pulled: updatedTasks ?? [],
    server_time: new Date().toISOString(),
  })
}
