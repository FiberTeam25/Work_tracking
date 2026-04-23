'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { StatusChip } from './StatusChip'

interface Task {
  id: string
  task_date: string
  task_type: string
  status: string
  route_length_m: number | null
  quantity: number | null
  unit_price: number | null
  line_total: number | null
  contract_items: { code: string; description_ar: string } | null
  teams: { name: string; code: string } | null
  profiles: { full_name: string } | null
  from_cabinet: { code: string } | null
  to_box: { code: string } | null
  node_cabinet: { code: string } | null
  node_box: { code: string } | null
}

interface Props {
  tasks: Task[]
  teams: { id: string; name: string; code: string }[]
  total: number
  page: number
  pageSize: number
  canSeePrices: boolean
  role: string
  filters: { team?: string; status?: string; type?: string; q?: string }
}

export function TasksTable({ tasks, teams, total, page, pageSize, canSeePrices, filters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      {/* Filters */}
      <div
        className="mb-4 p-4 flex gap-2.5 flex-wrap items-center"
        style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}
      >
        <select
          value={filters.team ?? 'all'}
          onChange={(e) => updateFilter('team', e.target.value)}
          className="px-3 py-2 text-xs"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink-0)' }}
        >
          <option value="all">كل الفرق</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.code})
            </option>
          ))}
        </select>

        <select
          value={filters.type ?? 'all'}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="px-3 py-2 text-xs"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink-0)' }}
        >
          <option value="all">كل الأنواع</option>
          <option value="route">Route (بين نقطتين)</option>
          <option value="node">Node (نود واحد)</option>
        </select>

        <select
          value={filters.status ?? 'all'}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 text-xs"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink-0)' }}
        >
          <option value="all">كل الحالات</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="invoiced">Invoiced</option>
          <option value="rejected">Rejected</option>
        </select>

        <span
          className="font-mono text-xs px-2 py-1 ms-auto"
          style={{ color: 'var(--ink-1)', border: '1px solid var(--line-2)' }}
        >
          {total} تاسك
        </span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              {['#', 'التاريخ', 'التاسك / البند', 'المسار / النود', 'الفريق', 'الكمية', ...(canSeePrices ? ['القيمة'] : []), 'الحالة'].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-start text-xs uppercase tracking-wider font-medium"
                  style={{
                    background: 'var(--bg-2)',
                    color: 'var(--ink-2)',
                    borderBottom: '1px solid var(--line)',
                    position: 'sticky',
                    top: 0,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => {
              const num = (page - 1) * pageSize + i + 1
              const path =
                task.task_type === 'route'
                  ? `${task.from_cabinet?.code ?? '?'} → ${task.to_box?.code ?? '?'}`
                  : `${task.node_cabinet?.code ?? task.node_box?.code ?? '?'}`
              const qty =
                task.task_type === 'route'
                  ? `${task.route_length_m} م`
                  : `${task.quantity} PCS`

              return (
                <tr
                  key={task.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--line)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-2)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <td className="px-3 py-2.5 font-mono" style={{ color: 'var(--ink-2)' }}>
                    T-{String(num).padStart(4, '0')}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--ink-2)' }}>
                    {task.task_date}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium" style={{ color: 'var(--ink-0)' }}>
                      {task.contract_items?.description_ar}
                    </div>
                    <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--accent)' }}>
                      {task.contract_items?.code}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs" style={{ color: 'var(--ink-1)' }}>
                    {path}
                  </td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--ink-1)' }}>
                    {task.teams?.name}
                    {task.profiles?.full_name && (
                      <div style={{ color: 'var(--ink-2)' }}>م. {task.profiles.full_name}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-end font-medium" style={{ color: 'var(--ink-0)' }}>
                    {qty}
                  </td>
                  {canSeePrices && (
                    <td className="px-3 py-2.5 font-mono text-end" style={{ color: 'var(--ink-1)' }}>
                      {task.line_total != null
                        ? `${task.line_total.toLocaleString('en-US')} ج`
                        : '—'}
                    </td>
                  )}
                  <td className="px-3 py-2.5">
                    <StatusChip status={task.status as any} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {tasks.length === 0 && (
          <div className="py-10 text-center text-sm" style={{ color: 'var(--ink-2)' }}>
            لا توجد تاسكات تطابق الفلتر
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 text-xs"
            style={{ borderTop: '1px solid var(--line)', color: 'var(--ink-2)' }}
          >
            <span>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} من {total}
            </span>
            <div className="flex gap-1">
              {page > 1 && (
                <button
                  onClick={() => updateFilter('page', String(page - 1))}
                  className="px-2.5 py-1 font-mono"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink-1)', cursor: 'pointer' }}
                >
                  ‹
                </button>
              )}
              {page < totalPages && (
                <button
                  onClick={() => updateFilter('page', String(page + 1))}
                  className="px-2.5 py-1 font-mono"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink-1)', cursor: 'pointer' }}
                >
                  ›
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
