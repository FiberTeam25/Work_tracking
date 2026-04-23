import { createServerClient } from '@/lib/supabase/server'
import { MaterialsClient, type MaterialRow } from '@/components/materials/MaterialsClient'

export const revalidate = 60

export default async function MaterialsPage() {
  const supabase = await createServerClient()

  const { data: materials } = await supabase
    .from('mv_material_status')
    .select('*')
    .order('consumption_pct', { ascending: false })

  const rows: MaterialRow[] = (materials ?? []) as MaterialRow[]

  const critical = rows.filter((m) => m.alert_level === 'critical').length
  const warning  = rows.filter((m) => m.alert_level === 'warning').length
  const ok       = rows.filter((m) => m.alert_level === 'ok').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ink-0)' }}>
          حصر المواد
        </h1>
        <span className="text-xs font-mono" style={{ color: 'var(--ink-2)' }}>
          {rows.length} مادة
        </span>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--ink-2)' }}>
            حالة حرجة
          </div>
          <div className="text-3xl font-bold font-mono" style={{ color: 'var(--danger)' }}>
            {critical}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--ink-2)' }}>
            استهلاك &gt; 80%
          </div>
        </div>

        <div className="card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--ink-2)' }}>
            تحذير
          </div>
          <div className="text-3xl font-bold font-mono" style={{ color: 'var(--warn)' }}>
            {warning}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--ink-2)' }}>
            استهلاك 60–80%
          </div>
        </div>

        <div className="card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--ink-2)' }}>
            مستوى جيد
          </div>
          <div className="text-3xl font-bold font-mono" style={{ color: 'var(--success)' }}>
            {ok}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--ink-2)' }}>
            استهلاك &lt; 60%
          </div>
        </div>
      </div>

      {/* Client-side searchable/filterable table */}
      <MaterialsClient materials={rows} />
    </div>
  )
}
