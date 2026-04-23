import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

const TYPE_COLOR: Record<string, string> = {
  ODF: '#ff7a1a',
  FDT: '#00d4ff',
  FAT: '#a78bfa',
}

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  active:      { label: 'نشط',     color: 'var(--accent-2)' },
  completed:   { label: 'مكتمل',   color: 'var(--success)'  },
  planned:     { label: 'مخطط',    color: 'var(--ink-2)'    },
  maintenance: { label: 'صيانة',   color: 'var(--warn)'     },
}

export const revalidate = 30

export default async function NetworkPage() {
  const supabase = await createServerClient()

  // Resolve the first active site
  const { data: site } = await supabase
    .from('sites')
    .select('id, code, name_ar')
    .limit(1)
    .maybeSingle()

  // Fetch cabinets for the site
  const { data: cabinets } = await supabase
    .from('cabinets')
    .select('id, code, type, status, fiber_count, created_at')
    .eq('site_id', site?.id ?? '')
    .order('code')

  // Fetch all boxes belonging to those cabinets
  const cabinetIds = (cabinets ?? []).map((c) => c.id)

  const { data: boxes } = cabinetIds.length
    ? await supabase
        .from('boxes')
        .select('id, cabinet_id, code, type, status, fiber_count')
        .in('cabinet_id', cabinetIds)
        .order('code')
    : { data: [] }

  // Group boxes by cabinet
  type BoxRow = NonNullable<typeof boxes>[number]
  const boxesByCabinet = (boxes ?? []).reduce<Record<string, BoxRow[]>>((acc, box) => {
    ;(acc[box.cabinet_id] ??= []).push(box)
    return acc
  }, {})

  // Aggregate KPIs
  const totalCabinets    = (cabinets ?? []).length
  const activeCabinets   = (cabinets ?? []).filter((c) => c.status === 'active').length
  const completedCabinets = (cabinets ?? []).filter((c) => c.status === 'completed').length
  const totalBoxes       = (boxes ?? []).length
  const completedBoxes   = (boxes ?? []).filter((b) => b.status === 'completed').length

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink-0)' }}>
            الكابينات والبوكسات
          </h1>
          {site && (
            <p className="text-sm mt-1" style={{ color: 'var(--ink-2)' }}>
              {site.code} — {site.name_ar}
            </p>
          )}
        </div>
        <Link
          href="/map"
          className="btn-accent text-sm px-4 py-2"
          style={{ textDecoration: 'none' }}
        >
          ◉ عرض على الخريطة
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الكابينات', value: totalCabinets,     color: 'var(--ink-0)'    },
          { label: 'كابينات نشطة',     value: activeCabinets,    color: 'var(--accent-2)' },
          { label: 'كابينات مكتملة',   value: completedCabinets, color: 'var(--success)'  },
          {
            label: 'البوكسات',
            value: `${completedBoxes}/${totalBoxes}`,
            color: 'var(--ink-0)',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="card p-4"
          >
            <div className="text-xs mb-1" style={{ color: 'var(--ink-2)' }}>
              {kpi.label}
            </div>
            <div
              className="text-3xl font-bold font-mono"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Cabinet grid */}
      {totalCabinets === 0 ? (
        <div
          className="card p-10 text-center text-sm"
          style={{ color: 'var(--ink-2)' }}
        >
          لا توجد كابينات مسجلة لهذا الموقع
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {(cabinets ?? []).map((cab) => {
            const cabBoxes      = boxesByCabinet[cab.id] ?? []
            const doneBoxes     = cabBoxes.filter((b) => b.status === 'completed').length
            const pct           = cabBoxes.length > 0 ? Math.round((doneBoxes / cabBoxes.length) * 100) : 0
            const typeColor     = TYPE_COLOR[cab.type] ?? '#6b7788'
            const statusInfo    = STATUS_INFO[cab.status] ?? { label: cab.status, color: 'var(--ink-2)' }
            const barFill       = pct >= 90 ? 'var(--success)' : pct >= 50 ? 'var(--warn)' : 'var(--accent-2)'

            return (
              <div key={cab.id} className="card p-5 space-y-4">
                {/* Cabinet header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Type badge */}
                    <div
                      className="w-10 h-10 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
                      style={{
                        background: `${typeColor}20`,
                        color: typeColor,
                        border: `1px solid ${typeColor}50`,
                      }}
                    >
                      {cab.type}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="font-bold font-mono"
                        style={{ color: 'var(--ink-0)' }}
                      >
                        {cab.code}
                      </div>
                      {cab.fiber_count != null && (
                        <div className="text-xs" style={{ color: 'var(--ink-2)' }}>
                          {cab.fiber_count} ليف
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className="chip text-xs flex-shrink-0"
                    style={{
                      color:       statusInfo.color,
                      borderColor: `${statusInfo.color}50`,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Box completion progress */}
                <div>
                  <div
                    className="flex justify-between text-xs mb-1.5"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    <span>البوكسات: {doneBoxes}/{cabBoxes.length}</span>
                    <span
                      className="font-mono"
                      style={{ color: pct >= 90 ? 'var(--success)' : pct >= 50 ? 'var(--warn)' : 'var(--ink-1)' }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: '5px', background: 'var(--bg-3)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: barFill }}
                    />
                  </div>
                </div>

                {/* Box list (first 5) */}
                {cabBoxes.length > 0 && (
                  <div className="space-y-0">
                    {cabBoxes.slice(0, 5).map((box) => {
                      const dotColor =
                        box.status === 'completed' ? 'var(--success)' :
                        box.status === 'active'    ? 'var(--accent-2)' :
                        'var(--ink-3)'
                      return (
                        <div
                          key={box.id}
                          className="flex items-center justify-between text-xs py-1.5"
                          style={{ borderTop: '1px solid var(--line)' }}
                        >
                          <span className="font-mono" style={{ color: 'var(--ink-1)' }}>
                            {box.code}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{ background: dotColor }}
                            />
                            <span style={{ color: 'var(--ink-2)' }}>{box.type}</span>
                            {box.fiber_count != null && (
                              <span className="font-mono" style={{ color: 'var(--ink-2)' }}>
                                ×{box.fiber_count}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {cabBoxes.length > 5 && (
                      <div
                        className="text-xs pt-2"
                        style={{ color: 'var(--ink-2)', borderTop: '1px solid var(--line)' }}
                      >
                        +{cabBoxes.length - 5} بوكس آخر
                      </div>
                    )}
                  </div>
                )}

                {cabBoxes.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--ink-2)' }}>
                    لا توجد بوكسات مسجلة
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
