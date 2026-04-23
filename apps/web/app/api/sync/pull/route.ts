import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fullProfile } = await supabase
    .from('profiles')
    .select('id, team_id, role')
    .eq('id', user.id)
    .single()
  if (!fullProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const lastPulledAt = searchParams.get('last_pulled_at')
  const since = lastPulledAt && lastPulledAt !== '0'
    ? new Date(Number(lastPulledAt)).toISOString()
    : null

  // Active project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  const timestamp = Date.now()

  // ── Tasks: only this team's tasks ─────────────────────────────────────
  let tasksQuery = supabase
    .from('tasks')
    .select(
      'id, client_id, project_id, site_id, contract_item_id, team_id, technician_id,' +
      'task_date, task_type, status, route_length_m, quantity, unit_price, line_total,' +
      'notes, gps_accuracy_m, submitted_at, synced_at, reviewed_at, created_at'
    )

  if (fullProfile.team_id) {
    tasksQuery = tasksQuery.eq('team_id', fullProfile.team_id)
  } else if (fullProfile.role === 'field_technician') {
    tasksQuery = tasksQuery.eq('technician_id', user.id)
  }

  if (since) {
    tasksQuery = tasksQuery.gt('updated_at', since)
  }

  const { data: tasks } = await tasksQuery.limit(500)

  // ── Contract items: readable by all ───────────────────────────────────
  let contractItemsQuery = supabase
    .from('contract_items')
    .select('id, group_code, code, description_ar, description_en, unit, task_type, contract_qty, updated_at')

  if (project?.id) {
    contractItemsQuery = contractItemsQuery.eq('project_id', project.id)
  }

  if (since) {
    contractItemsQuery = contractItemsQuery.gt('updated_at', since)
  }

  const { data: contractItems } = await contractItemsQuery.limit(500)

  // ── Cabinets: for map/task reference ──────────────────────────────────
  let cabinetsQuery = supabase
    .from('cabinets')
    .select('id, site_id, code, type, status, updated_at')

  if (since) {
    cabinetsQuery = cabinetsQuery.gt('updated_at', since)
  }

  const { data: cabinets } = await cabinetsQuery.limit(200)

  // ── Format as WatermelonDB changes object ──────────────────────────────
  const changes = {
    tasks: {
      created: since ? [] : (tasks ?? []).map(toWatermelonTask),
      updated: since ? (tasks ?? []).map(toWatermelonTask) : [],
      deleted: [],
    },
    contract_items: {
      created: since ? [] : (contractItems ?? []).map(toWatermelonContractItem),
      updated: since ? (contractItems ?? []).map(toWatermelonContractItem) : [],
      deleted: [],
    },
    cabinets: {
      created: since ? [] : (cabinets ?? []).map(toWatermelonCabinet),
      updated: since ? (cabinets ?? []).map(toWatermelonCabinet) : [],
      deleted: [],
    },
    task_photos: {
      created: [],
      updated: [],
      deleted: [],
    },
  }

  return NextResponse.json({ changes, timestamp })
}

function toWatermelonTask(t: Record<string, unknown>) {
  return {
    id: t['client_id'] ?? t['id'],
    server_id: t['id'],
    project_id: t['project_id'],
    contract_item_id: t['contract_item_id'],
    team_id: t['team_id'],
    task_type: t['task_type'],
    task_date: t['task_date'],
    route_length_m: t['route_length_m'],
    quantity: t['quantity'],
    notes: t['notes'],
    status: t['status'],
    gps_accuracy_m: t['gps_accuracy_m'],
    is_synced: true,
    synced_at: t['synced_at']
      ? new Date(t['synced_at'] as string).getTime()
      : null,
    created_at_unix: t['created_at']
      ? new Date(t['created_at'] as string).getTime()
      : Date.now(),
  }
}

function toWatermelonContractItem(c: Record<string, unknown>) {
  return {
    id: c['id'],
    server_id: c['id'],
    group_code: c['group_code'],
    code: c['code'],
    description_ar: c['description_ar'],
    description_en: c['description_en'],
    unit: c['unit'],
    task_type: c['task_type'],
    contract_qty: c['contract_qty'],
    synced_at: c['updated_at']
      ? new Date(c['updated_at'] as string).getTime()
      : Date.now(),
  }
}

function toWatermelonCabinet(cab: Record<string, unknown>) {
  return {
    id: cab['id'],
    server_id: cab['id'],
    site_id: cab['site_id'],
    code: cab['code'],
    type: cab['type'],
    status: cab['status'],
    synced_at: cab['updated_at']
      ? new Date(cab['updated_at'] as string).getTime()
      : Date.now(),
  }
}
