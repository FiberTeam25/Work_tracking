import { StatusChip } from '@/components/tasks/StatusChip'

interface Task {
  id: string
  created_at: string
  contract_items?: { description_ar: string } | null
  teams?: { name: string } | null
  route_length_m?: number | null
  quantity?: number | null
  status: string
  from_cabinet_id?: string | null
  to_box_id?: string | null
}

const FALLBACK: Task[] = [
  { id: 't1', created_at: '09:42', contract_items: { description_ar: 'رمي ميكرودكت 7/3.5' }, teams: { name: 'فريق 2' }, route_length_m: 243, status: 'pending' },
  { id: 't2', created_at: '08:55', contract_items: { description_ar: 'لحام closure 144F' }, teams: { name: 'فريق 1' }, quantity: 1, status: 'approved' },
  { id: 't3', created_at: '08:30', contract_items: { description_ar: 'تركيب FAT 4F + splitter 1:16' }, teams: { name: 'فريق 3' }, quantity: 1, status: 'approved' },
  { id: 't4', created_at: '07:50', contract_items: { description_ar: 'حفر مسار micro-trenching' }, teams: { name: 'فريق 2' }, route_length_m: 131, status: 'approved' },
  { id: 't5', created_at: '07:12', contract_items: { description_ar: 'رمي ميكرودكت 1×24' }, teams: { name: 'فريق 1' }, route_length_m: 161, status: 'draft' },
]

export function RecentTasksCard({ tasks }: { tasks: Task[] }) {
  const data = tasks.length > 0 ? tasks : FALLBACK

  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--ink-0)' }}>
          آخر التاسكات المُدخلة
          <span
            className="font-mono text-xs px-1.5 py-px"
            style={{ color: 'var(--accent-2)', border: '1px solid rgba(0,212,255,.3)' }}
          >
            آخر 24 ساعة
          </span>
        </div>
        <a href="/tasks" className="text-xs" style={{ color: 'var(--ink-2)', textDecoration: 'none' }}>
          عرض الكل →
        </a>
      </div>
      <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            {['الوقت', 'التاسك', 'الفريق', 'الكمية', 'الحالة'].map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-start text-xs uppercase tracking-wider font-medium"
                style={{
                  background: 'var(--bg-2)',
                  color: 'var(--ink-2)',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((task) => {
            const time = new Date(task.created_at).toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
            })
            const qty = task.route_length_m
              ? `${task.route_length_m}م`
              : task.quantity
              ? `${task.quantity} PCS`
              : '—'

            return (
              <tr
                key={task.id}
                className="cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid var(--line)' }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = 'var(--bg-2)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = 'transparent')
                }
              >
                <td className="px-3 py-2.5 font-mono" style={{ color: 'var(--ink-2)' }}>
                  {time}
                </td>
                <td className="px-3 py-2.5" style={{ color: 'var(--ink-1)' }}>
                  <div className="font-medium" style={{ color: 'var(--ink-0)' }}>
                    {task.contract_items?.description_ar}
                  </div>
                </td>
                <td className="px-3 py-2.5" style={{ color: 'var(--ink-1)' }}>
                  {task.teams?.name}
                </td>
                <td className="px-3 py-2.5 font-mono" style={{ color: 'var(--ink-1)' }}>
                  {qty}
                </td>
                <td className="px-3 py-2.5">
                  <StatusChip status={task.status as any} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
