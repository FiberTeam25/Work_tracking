import dynamic from 'next/dynamic'

// Leaflet must not render on server
const SiteMap = dynamic(() => import('@/components/map/SiteMap'), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--ink-2)' }}>
    جاري تحميل الخريطة...
  </div>
)})

export function SiteMapCard({ projectId }: { projectId: string }) {
  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}>
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--ink-0)' }}>
          خريطة الموقع
          <span
            className="font-mono text-xs px-1.5 py-px"
            style={{ color: 'var(--accent-2)', border: '1px solid rgba(0,212,255,.3)' }}
          >
            LIVE · 4 كابينات
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            className="text-xs px-2.5 py-1"
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--ink-1)',
              cursor: 'pointer',
            }}
          >
            ⊕ تكبير
          </button>
          <button
            className="text-xs px-2.5 py-1"
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
      <div style={{ height: '380px' }}>
        <SiteMap projectId={projectId} />
      </div>
    </div>
  )
}
