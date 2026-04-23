import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { KpiRow } from '@/components/dashboard/KpiRow'
import { CabinetProgress } from '@/components/dashboard/CabinetProgress'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { RecentTasksCard } from '@/components/dashboard/RecentTasksCard'
import { SiteMapCard } from '@/components/dashboard/SiteMapCard'

export const revalidate = 60 // ISR — refresh every 60 seconds

async function getDashboardData(projectId: string) {
  const supabase = await createServerClient()

  const [kpisRes, cabinetsRes, alertsRes, recentTasksRes] = await Promise.all([
    supabase.rpc('get_dashboard_kpis', { p_project_id: projectId }),
    supabase
      .from('cabinets')
      .select(
        `*,
        boxes(count),
        tasks!tasks_node_cabinet_id_fkey(count).filter(status.eq.approved)`
      )
      .eq('site_id', projectId)
      .order('code'),
    supabase
      .from('materials')
      .select('*')
      .eq('project_id', projectId)
      .gte('consumed_qty', 'alert_threshold * contract_qty / 100')
      .limit(5),
    supabase
      .from('tasks')
      .select('*, profiles(full_name), teams(name), contract_items(description_ar)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return {
    kpis: kpisRes.data,
    cabinets: cabinetsRes.data ?? [],
    alerts: alertsRes.data ?? [],
    recentTasks: recentTasksRes.data ?? [],
  }
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, code, name_ar')
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!projects) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--ink-2)' }}>
        لا توجد مشاريع نشطة
      </div>
    )
  }

  const data = await getDashboardData(projects.id)

  return (
    <div className="p-6">
      {/* Page header */}
      <div
        className="flex items-end justify-between pb-4 mb-5"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div>
          <h1
            className="text-xl font-semibold flex items-center gap-3"
            style={{ color: 'var(--ink-0)' }}
          >
            Dashboard
            <span
              className="font-mono text-xs px-2 py-1"
              style={{
                color: 'var(--accent)',
                background: 'rgba(255,122,26,.1)',
                border: '1px solid rgba(255,122,26,.3)',
              }}
            >
              {projects.code}
            </span>
          </h1>
          <div className="text-xs mt-1" style={{ color: 'var(--ink-2)' }}>
            {projects.name_ar} · عقد Fiberization 2025-2026
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 text-xs"
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--ink-1)',
              cursor: 'pointer',
            }}
          >
            ⤓ تصدير
          </button>
          <button
            className="px-3 py-2 text-xs"
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              color: 'var(--ink-0)',
              cursor: 'pointer',
            }}
          >
            📅 الأسبوع الحالي
          </button>
        </div>
      </div>

      {/* KPIs */}
      <Suspense fallback={<div className="h-24 mb-5" style={{ background: 'var(--bg-1)' }} />}>
        <KpiRow kpis={data.kpis} />
      </Suspense>

      {/* Main grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="flex flex-col gap-4">
          <SiteMapCard projectId={projects.id} />
          <RecentTasksCard tasks={data.recentTasks} />
        </div>
        <div className="flex flex-col gap-4">
          <CabinetProgress cabinets={data.cabinets} />
          <AlertsPanel alerts={data.alerts} />
        </div>
      </div>
    </div>
  )
}
