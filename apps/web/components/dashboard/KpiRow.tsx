interface KpiData {
  completion_pct: number
  microduct_m: number
  microduct_target_m: number
  boxes_installed: number
  boxes_total: number
  receivables_egp: number
  weekly_microduct_delta: number
  weekly_completion_delta: number
}

function Kpi({
  label,
  value,
  unit,
  meta,
  pct,
}: {
  label: string
  value: string
  unit?: string
  meta?: React.ReactNode
  pct?: number
}) {
  return (
    <div
      className="relative overflow-hidden p-4"
      style={{ background: 'var(--bg-1)' }}
    >
      {/* Corner accent */}
      <div
        className="absolute top-0 end-0 w-10 h-10 opacity-10"
        style={{
          background: 'var(--accent)',
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
        }}
      />
      <div className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--ink-2)' }}>
        {label}
      </div>
      <div className="font-mono text-2xl font-bold leading-none" style={{ color: 'var(--ink-0)' }}>
        {value}
        {unit && (
          <small className="text-sm font-normal ms-1" style={{ color: 'var(--ink-2)' }}>
            {unit}
          </small>
        )}
      </div>
      {meta && (
        <div className="mt-2 text-xs flex items-center gap-1.5" style={{ color: 'var(--ink-2)' }}>
          {meta}
        </div>
      )}
      {pct !== undefined && (
        <div className="mt-2 progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(pct, 100)}%`, background: 'var(--accent)' }}
          />
        </div>
      )}
    </div>
  )
}

export function KpiRow({ kpis }: { kpis: KpiData | null }) {
  // Fallback to prototype data if no DB data yet
  const data = kpis ?? {
    completion_pct: 64,
    microduct_m: 15746,
    microduct_target_m: 40000,
    boxes_installed: 89,
    boxes_total: 1695,
    receivables_egp: 99343,
    weekly_microduct_delta: 1230,
    weekly_completion_delta: 8,
  }

  return (
    <div
      className="grid mb-5"
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1px',
        background: 'var(--line)',
        border: '1px solid var(--line)',
      }}
    >
      <Kpi
        label="نسبة الإنجاز"
        value={`${data.completion_pct}`}
        unit="%"
        meta={
          <>
            <span style={{ color: 'var(--success)' }}>▲ {data.weekly_completion_delta}%</span>
            هذا الأسبوع
          </>
        }
        pct={data.completion_pct}
      />
      <Kpi
        label="مترمي ميكرودكت"
        value={data.microduct_m.toLocaleString('en-US')}
        unit="م"
        meta={
          <>
            من {data.microduct_target_m.toLocaleString('en-US')} م ·{' '}
            <span style={{ color: 'var(--success)' }}>
              ▲ {data.weekly_microduct_delta.toLocaleString('en-US')} هذا الأسبوع
            </span>
          </>
        }
      />
      <Kpi
        label="بوكسات مركبة"
        value={`${data.boxes_installed}`}
        unit={`/ ${data.boxes_total}`}
        meta={<><span style={{ color: 'var(--success)' }}>▲ 12</span> أمس</>}
      />
      <Kpi
        label="قيمة المستحقات"
        value={data.receivables_egp.toLocaleString('en-US')}
        unit="ج"
        meta={<>فاتورة #1 · معتمدة</>}
      />
    </div>
  )
}
