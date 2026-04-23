interface Cabinet {
  id: string
  code: string
  boxes_installed?: number
  microduct_m?: number
  done?: number
  total?: number
}

export function CabinetProgress({ cabinets }: { cabinets: Cabinet[] }) {
  // Fallback to prototype data
  const data =
    cabinets.length > 0
      ? cabinets
      : [
          { id: '1', code: 'CAB 2-1', boxes_installed: 16, microduct_m: 1975, done: 10, total: 12 },
          { id: '2', code: 'CAB 2-2', boxes_installed: 28, microduct_m: 7743, done: 22, total: 28 },
          { id: '3', code: 'CAB 2-3', boxes_installed: 25, microduct_m: 3568, done: 20, total: 25 },
          { id: '4', code: 'CAB 2-4', boxes_installed: 20, microduct_m: 2460, done: 14, total: 20 },
          { id: '5', code: 'CAB 2-5', boxes_installed: 16, microduct_m: 1975, done: 16, total: 16 },
        ]

  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="text-sm font-semibold" style={{ color: 'var(--ink-0)' }}>
          الإنجاز حسب الكابينة
        </div>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {data.map((cab) => {
          const done = cab.done ?? 0
          const total = cab.total ?? 1
          const pct = Math.round((done / total) * 100)
          const barColor =
            pct >= 90 ? 'var(--success)' : pct >= 50 ? 'var(--accent)' : 'var(--warn)'

          return (
            <div key={cab.id}>
              <div className="flex justify-between items-end mb-1.5">
                <div>
                  <span className="font-mono text-sm font-bold" style={{ color: 'var(--accent-2)' }}>
                    {cab.code}
                  </span>
                  <span className="text-xs ms-2" style={{ color: 'var(--ink-2)' }}>
                    {cab.boxes_installed} بوكس · {cab.microduct_m?.toLocaleString('en-US')}م
                  </span>
                </div>
                <span className="font-mono text-sm font-bold" style={{ color: 'var(--ink-0)' }}>
                  {done}/{total}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
