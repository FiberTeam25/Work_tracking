type TaskStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'invoiced'

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; border: string; bg: string }> = {
  draft: { label: 'Draft', color: 'var(--ink-1)', border: 'var(--line-2)', bg: 'transparent' },
  pending: { label: 'بانتظار الاعتماد', color: 'var(--warn)', border: 'rgba(253,176,34,.3)', bg: 'rgba(253,176,34,.08)' },
  approved: { label: 'معتمد', color: 'var(--success)', border: 'rgba(50,213,131,.3)', bg: 'rgba(50,213,131,.08)' },
  rejected: { label: 'مرفوض', color: 'var(--danger)', border: 'rgba(240,68,56,.3)', bg: 'rgba(240,68,56,.08)' },
  invoiced: { label: 'في الفاتورة', color: 'var(--accent-2)', border: 'rgba(0,212,255,.3)', bg: 'rgba(0,212,255,.08)' },
}

export function StatusChip({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft

  return (
    <span
      className="chip"
      style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}
    >
      <span
        className="w-1 h-1 rounded-full flex-shrink-0"
        style={{ background: cfg.color, display: 'inline-block' }}
      />
      {cfg.label}
    </span>
  )
}
