interface Alert {
  id: string
  type: 'danger' | 'warn' | 'info'
  title: string
  detail: string
}

const DEFAULT_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'danger',
    title: 'كمية الميكرودكت 7/3.5 أقل من المطلوب',
    detail: 'المخزون: 2,400م · المطلوب هذا الأسبوع: 3,100م',
  },
  {
    id: '2',
    type: 'warn',
    title: '12 تاسك في انتظار الاعتماد',
    detail: 'م. أحمد صلاح · من أمس',
  },
  {
    id: '3',
    type: 'info',
    title: 'فاتورة #2 جاهزة للمراجعة',
    detail: '142,580 ج · CAB 2-2 و 2-3',
  },
]

const ALERT_STYLES = {
  danger: {
    borderColor: 'var(--danger)',
    icon: '▲',
    iconColor: 'var(--danger)',
  },
  warn: {
    borderColor: 'var(--warn)',
    icon: '◐',
    iconColor: 'var(--warn)',
  },
  info: {
    borderColor: 'var(--accent-2)',
    icon: 'ℹ',
    iconColor: 'var(--accent-2)',
  },
}

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  const data = alerts.length > 0 ? alerts : DEFAULT_ALERTS

  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="text-sm font-semibold" style={{ color: 'var(--ink-0)' }}>
          تنبيهات
        </div>
        <span
          className="chip"
          style={{
            color: 'var(--danger)',
            borderColor: 'rgba(240,68,56,.3)',
            background: 'rgba(240,68,56,.08)',
          }}
        >
          <span
            className="w-1 h-1 rounded-full"
            style={{ background: 'var(--danger)', display: 'inline-block' }}
          />
          {data.length}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-2.5">
        {data.map((alert) => {
          const style = ALERT_STYLES[alert.type]
          return (
            <div
              key={alert.id}
              className="flex gap-2.5 p-2.5"
              style={{
                background: 'var(--bg-2)',
                borderInlineStart: `2px solid ${style.borderColor}`,
              }}
            >
              <div className="text-lg flex-shrink-0" style={{ color: style.iconColor }}>
                {style.icon}
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--ink-0)' }}>
                  {alert.title}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--ink-2)' }}>
                  {alert.detail}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
