'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Site {
  id: string
  code: string
  name_ar: string
  name_en: string
}

export function GenerateInvoiceButton() {
  const t = useTranslations('invoice')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState<Site[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    site_id: '',
    period_start: '',
    period_end: '',
    retention_pct: 10,
    tax_pct: 1,
  })

  // Fetch sites when modal opens
  useEffect(() => {
    if (!open || sites.length > 0) return
    fetch('/api/sites')
      .then((r) => r.json())
      .then((d) => setSites(d.sites ?? []))
      .catch(() => {})
  }, [open])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.site_id) { setError('اختر موقعاً'); return }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'فشل الإنشاء')

      setOpen(false)
      router.push(`/invoices/${data.invoice_id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn-accent" onClick={() => setOpen(true)}>
        + {t('new')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-0">{t('generate')}</h2>
              <button className="text-ink-2 hover:text-ink-0" onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Site selector */}
              <div>
                <label className="block text-sm text-ink-1 mb-1">{t('site')}</label>
                <select
                  required
                  className="input w-full"
                  value={form.site_id}
                  onChange={(e) => setForm((f) => ({ ...f, site_id: e.target.value }))}
                >
                  <option value="">— اختر موقعاً —</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name_ar}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-ink-1 mb-1">{t('periodStart')}</label>
                  <input
                    type="date"
                    required
                    className="input w-full"
                    value={form.period_start}
                    onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-ink-1 mb-1">{t('periodEnd')}</label>
                  <input
                    type="date"
                    required
                    className="input w-full"
                    value={form.period_end}
                    onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))}
                  />
                </div>
              </div>

              {/* Deduction rates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-ink-1 mb-1">خصم الضمان %</label>
                  <input
                    type="number"
                    min={0} max={100} step={0.5}
                    className="input w-full"
                    value={form.retention_pct}
                    onChange={(e) => setForm((f) => ({ ...f, retention_pct: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-ink-1 mb-1">ضريبة القيمة المضافة %</label>
                  <input
                    type="number"
                    min={0} max={100} step={0.5}
                    className="input w-full"
                    value={form.tax_pct}
                    onChange={(e) => setForm((f) => ({ ...f, tax_pct: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                  {t('..') ?? 'إلغاء'}
                </button>
                <button type="submit" className="btn-accent" disabled={loading}>
                  {loading ? '...' : t('generate')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
