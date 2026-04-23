import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { z } from 'zod'

const PushedTaskSchema = z.object({
  id: z.string(),             // WatermelonDB local ID (= client_id)
  server_id: z.string().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  contract_item_id: z.string().uuid().nullable().optional(),
  team_id: z.string().uuid().nullable().optional(),
  task_type: z.enum(['route', 'node']),
  task_date: z.string(),
  route_length_m: z.number().nullable().optional(),
  quantity: z.number().nullable().optional(),
  gps_lat: z.number().nullable().optional(),
  gps_lng: z.number().nullable().optional(),
  gps_accuracy_m: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.string().optional(),
  is_synced: z.boolean().optional(),
  synced_at: z.number().nullable().optional(),
  created_at_unix: z.number().optional(),
})

const PushChangesSchema = z.object({
  changes: z.object({
    tasks: z.object({
      created: z.array(PushedTaskSchema).optional().default([]),
      updated: z.array(PushedTaskSchema).optional().default([]),
      deleted: z.array(z.string()).optional().default([]),
    }).optional(),
    task_photos: z.object({
      created: z.array(z.record(z.unknown())).optional().default([]),
      updated: z.array(z.record(z.unknown())).optional().default([]),
      deleted: z.array(z.string()).optional().default([]),
    }).optional(),
    contract_items: z.object({
      created: z.array(z.record(z.unknown())).optional().default([]),
      updated: z.array(z.record(z.unknown())).optional().default([]),
      deleted: z.array(z.string()).optional().default([]),
    }).optional(),
    cabinets: z.object({
      created: z.array(z.record(z.unknown())).optional().default([]),
      updated: z.array(z.record(z.unknown())).optional().default([]),
      deleted: z.array(z.string()).optional().default([]),
    }).optional(),
  }),
  lastPulledAt: z.number().nullable().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, team_id, role')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const body = await request.json()
  const parsed = PushChangesSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { changes } = parsed.data
  const tasksToUpsert = [
    ...(changes.tasks?.created ?? []),
    ...(changes.tasks?.updated ?? []),
  ]

  for (const task of tasksToUpsert) {
    // Skip server-pushed records (client_id already exists on server)
    const clientId = task.id

    const gpsPoint =
      task.gps_lat != null && task.gps_lng != null
        ? `SRID=4326;POINT(${task.gps_lng} ${task.gps_lat})`
        : null

    // Look up unit_price if we have a contract_item_id
    let unitPrice: number | null = null
    if (task.contract_item_id) {
      const { data: ci } = await supabase
        .from('contract_items')
        .select('unit_price')
        .eq('id', task.contract_item_id)
        .single()
      unitPrice = ci?.unit_price ?? null
    }

    await supabase.from('tasks').upsert(
      {
        client_id: clientId,
        project_id: task.project_id ?? null,
        contract_item_id: task.contract_item_id ?? null,
        team_id: task.team_id ?? profile.team_id ?? null,
        technician_id: user.id,
        task_date: task.task_date,
        task_type: task.task_type,
        status: 'pending',
        route_length_m: task.route_length_m ?? null,
        quantity: task.quantity ?? null,
        unit_price: unitPrice,
        gps_location: gpsPoint,
        gps_accuracy_m: task.gps_accuracy_m ?? null,
        notes: task.notes ?? null,
        submitted_at: task.created_at_unix
          ? new Date(task.created_at_unix).toISOString()
          : new Date().toISOString(),
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'client_id', ignoreDuplicates: false }
    )
  }

  return NextResponse.json({ success: true })
}
