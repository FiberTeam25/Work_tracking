import dynamic from 'next/dynamic'
import { createServerClient } from '@/lib/supabase/server'

const SiteMap = dynamic(() => import('@/components/map/SiteMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center text-sm"
      style={{ background: 'var(--bg-0)', color: 'var(--ink-2)' }}
    >
      جاري تحميل الخريطة...
    </div>
  ),
})

export default async function MapPage() {
  const supabase = await createServerClient()

  const { data: projectData } = await supabase
    .from('projects')
    .select('id, code, name_ar')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const project = projectData as { id: string; code: string; name_ar: string } | null

  const { data: stats } = await supabase
    .from('cabinets')
    .select('status')
    .eq(
      'site_id',
      // resolve site_id via a sub-select isn't directly possible with JS client;
      // we'll show cabinet count from mv_cabinet_progress if available
      project?.id ?? ''
    )

  // Fetch cabinet counts from materialized view
  const { data: cabinetProgress } = await supabase
    .from('mv_cabinet_progress')
    .select('cabinet_id, completion_pct')

  const cabinetCount    = cabinetProgress?.length ?? 0
  const completedCount  = cabinetProgress?.filter((c) => (c.completion_pct ?? 0) >= 100).length ?? 0

  return (
    // h-full fills the <main overflow-y-auto> grid cell (grid row 2, col 2)
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-1)' }}
      >
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--ink-0)' }}>
            خريطة الموقع
          </h1>
          {project && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-2)' }}>
              {project.code} — {project.name_ar}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Live badge */}
          <span
            className="text-xs font-mono px-2 py-1 flex items-center gap-1.5"
            style={{ border: '1px solid rgba(0,212,255,.3)', color: 'var(--accent-2)' }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--success)', animation: 'pulse 2s infinite' }}
            />
            LIVE
          </span>

          {/* Cabinet count badge */}
          <span
            className="text-xs font-mono px-2 py-1"
            style={{ border: '1px solid var(--line)', color: 'var(--ink-1)' }}
          >
            {completedCount}/{cabinetCount} كابينة مكتملة
          </span>

          {/* KMZ export (placeholder) */}
          <button
            className="text-xs px-3 py-1.5 font-medium"
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              color: 'var(--ink-0)',
              cursor: 'pointer',
            }}
          >
            تصدير KMZ
          </button>
        </div>
      </div>

      {/* Map fills remaining height */}
      <div className="flex-1 min-h-0">
        {project ? (
          <SiteMap projectId={project.id} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm"
            style={{ color: 'var(--ink-2)' }}
          >
            لا يوجد مشروع نشط
          </div>
        )}
      </div>
    </div>
  )
}
