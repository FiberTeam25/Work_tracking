'use client'

import { useState } from 'react'

export interface MaterialRow {
  material_id: string
  name_ar: string
  name_en: string | null
  unit: string
  contract_qty: number
  consumed_qty: number
  consumption_pct: number
  alert_level: 'critical' | 'warning' | 'ok'
}

function alertTextColor(level: string) {
  if (level === 'critical') return 'var(--danger)'
  if (level === 'warning')  return 'var(--warn)'
  return 'var(--success)'
}

function alertBarColor(level: string) {
  if (level === 'critical') return 'var(--danger)'
  if (level === 'warning')  return 'var(--warn)'
  return 'var(--success)'
}

function alertLabel(level: string) {
  if (level === 'critical') return 'حرج'
  if (level === 'warning')  return 'تحذير'
  return 'جيد'
}

export function MaterialsClient({ materials }: { materials: MaterialRow[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'ok'>('all')

  const filtered = materials.filter((m) => {
    const matchesSearch =
      m.name_ar.includes(search) ||
      (m.name_en ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || m.alert_level === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="بحث عن مادة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ maxWidth: '260px' }}
        />

        {/* Alert level filter tabs */}
        <div className="flex gap-1">
          {(['all', 'critical', 'warning', 'ok'] as const).map((level) => {
            const labels: Record<string, string> = {
              all: 'الكل',
              critical: 'حرج',
              warning: 'تحذير',
              ok: 'جيد',
            }
            const isActive = filter === level
            return (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className="text-xs px-3 py-1.5 font-mono transition-colors"
                style={{
                  background: isActive ? 'var(--bg-3)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--line-2)' : 'var(--line)'}`,
                  color: isActive ? 'var(--ink-0)' : 'var(--ink-2)',
                  cursor: 'pointer',
                }}
              >
                {labels[level]}
              </button>
            )
          })}
        </div>

        <span className="text-xs ms-auto" style={{ color: 'var(--ink-2)' }}>
          {filtered.length} / {materials.length} مادة
        </span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)' }}>
              <th className="px-4 py-3 text-start font-medium" style={{ color: 'var(--ink-1)' }}>
                اسم المادة
              </th>
              <th className="px-4 py-3 text-start font-medium" style={{ color: 'var(--ink-1)' }}>
                الوحدة
              </th>
              <th className="px-4 py-3 text-end font-medium" style={{ color: 'var(--ink-1)' }}>
                الكمية التعاقدية
              </th>
              <th className="px-4 py-3 text-end font-medium" style={{ color: 'var(--ink-1)' }}>
                المستهلك
              </th>
              <th className="px-4 py-3 text-end font-medium" style={{ color: 'var(--ink-1)' }}>
                المتبقي
              </th>
              <th
                className="px-4 py-3 text-start font-medium"
                style={{ color: 'var(--ink-1)', minWidth: '180px' }}
              >
                نسبة الاستهلاك
              </th>
              <th className="px-4 py-3 text-start font-medium" style={{ color: 'var(--ink-1)' }}>
                التنبيه
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-sm"
                  style={{ color: 'var(--ink-2)' }}
                >
                  لا توجد نتائج
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const remaining = (m.contract_qty ?? 0) - (m.consumed_qty ?? 0)
                const pct       = Math.min(m.consumption_pct ?? 0, 100)
                const barColor  = alertBarColor(m.alert_level)
                const textColor = alertTextColor(m.alert_level)

                return (
                  <tr
                    key={m.material_id}
                    style={{ borderBottom: '1px solid var(--line)' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--bg-2)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--ink-0)' }}>
                      {m.name_ar}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--ink-1)' }}>
                      {m.unit}
                    </td>
                    <td className="px-4 py-3 text-end font-mono" style={{ color: 'var(--ink-0)' }}>
                      {m.contract_qty?.toLocaleString('ar-EG')}
                    </td>
                    <td className="px-4 py-3 text-end font-mono" style={{ color: 'var(--ink-0)' }}>
                      {m.consumed_qty?.toLocaleString('ar-EG')}
                    </td>
                    <td
                      className="px-4 py-3 text-end font-mono font-medium"
                      style={{ color: remaining < 0 ? 'var(--danger)' : 'var(--ink-0)' }}
                    >
                      {remaining.toLocaleString('ar-EG')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 rounded-full overflow-hidden"
                          style={{ height: '6px', background: 'var(--bg-3)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: barColor }}
                          />
                        </div>
                        <span
                          className="font-mono text-xs w-10 text-end"
                          style={{ color: textColor }}
                        >
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="chip text-xs"
                        style={{ color: textColor, borderColor: `${textColor}50` }}
                      >
                        {alertLabel(m.alert_level)}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
