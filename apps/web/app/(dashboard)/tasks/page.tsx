import { createServerClient } from '@/lib/supabase/server'
import { TasksTable } from '@/components/tasks/TasksTable'
import { TasksRealtimeProvider } from '@/components/tasks/TasksRealtimeProvider'

export const dynamic = 'force-dynamic'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; status?: string; type?: string; q?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id, can_see_prices')
    .eq('id', user!.id)
    .single()

  const page = parseInt(params.page ?? '1', 10)
  const pageSize = 25
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('tasks')
    .select(
      `id, task_date, task_type, status, route_length_m, quantity, unit_price, line_total, notes, created_at,
       contract_items(code, description_ar),
       teams(name, code),
       profiles!tasks_technician_id_fkey(full_name),
       from_cabinet:cabinets!tasks_from_cabinet_id_fkey(code),
       to_box:boxes!tasks_to_box_id_fkey(code),
       node_cabinet:cabinets!tasks_node_cabinet_id_fkey(code),
       node_box:boxes!tasks_node_box_id_fkey(code)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (params.status && params.status !== 'all') query = query.eq('status', params.status)
  if (params.type && params.type !== 'all') query = query.eq('task_type', params.type)
  if (params.team && params.team !== 'all') query = query.eq('team_id', params.team)

  // Technicians only see their own team
  if (profile?.role === 'field_technician' && profile.team_id) {
    query = query.eq('team_id', profile.team_id)
  }

  const { data: tasks, count } = await query

  const { data: teams } = await supabase.from('teams').select('id, name, code').order('code')

  return (
    <div className="p-6">
      <div
        className="flex items-end justify-between pb-4 mb-5"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--ink-0)' }}>
              التاسكات اليومية
            </h1>
            <TasksRealtimeProvider />
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--ink-2)' }}>
            كل الأعمال المُنفّذة على الأرض · قابلة للاعتماد أو الرفض
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 text-xs"
            style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink-1)', cursor: 'pointer' }}
          >
            ⤓ تصدير Excel
          </button>
          <button
            className="px-3 py-2 text-xs font-bold"
            style={{ background: 'var(--accent)', color: '#000', border: 'none', cursor: 'pointer' }}
          >
            + تاسك جديد
          </button>
        </div>
      </div>

      <TasksTable
        tasks={tasks ?? []}
        teams={teams ?? []}
        total={count ?? 0}
        page={page}
        pageSize={pageSize}
        canSeePrices={profile?.can_see_prices ?? false}
        role={profile?.role ?? 'field_technician'}
        filters={params}
      />
    </div>
  )
}
