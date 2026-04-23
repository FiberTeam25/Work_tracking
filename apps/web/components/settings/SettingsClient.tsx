'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const ROLE_LABELS: Record<string, string> = {
  admin:             'مدير النظام',
  project_manager:   'مدير مشروع',
  field_supervisor:  'مشرف ميداني',
  field_technician:  'فني ميداني',
  finance:           'مالية',
}

const ROLE_COLOR: Record<string, string> = {
  admin:             'var(--accent)',
  project_manager:   'var(--accent-2)',
  field_supervisor:  '#a78bfa',
  field_technician:  'var(--ink-1)',
  finance:           'var(--warn)',
}

interface User {
  id: string
  full_name: string
  role: string
  team_id: string | null
  is_active: boolean
  created_at: string
  lang: string
  phone: string | null
}

interface Team {
  id: string
  code: string
  name: string
}

interface Props {
  projectId:    string
  retentionPct: number
  taxPct:       number
  users:        User[]
  teams:        Team[]
}

// ─── Invite User Modal ────────────────────────────────────────────────────────

function InviteModal({ teams, onClose, onSuccess }: {
  teams: Team[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    email:     '',
    full_name: '',
    role:      'field_technician',
    team_id:   '',
    phone:     '',
  })
  const [error, setError]   = useState('')
  const [pending, start]    = useTransition()

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    start(async () => {
      const res = await fetch('/api/admin/invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:     form.email,
          full_name: form.full_name,
          role:      form.role,
          team_id:   form.team_id || null,
          phone:     form.phone || null,
        }),
      })
      if (res.ok) {
        onSuccess()
      } else {
        const json = await res.json()
        setError(typeof json.error === 'string' ? json.error : 'حدث خطأ أثناء إرسال الدعوة')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
    >
      <div
        className="w-full max-w-lg p-6 space-y-5"
        style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink-0)' }}>
            دعوة مستخدم جديد
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-1)' }}>
                البريد الإلكتروني *
              </label>
              <input
                required
                type="email"
                className="input"
                placeholder="name@example.com"
                dir="ltr"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-1)' }}>
                الاسم الكامل *
              </label>
              <input
                required
                className="input"
                placeholder="أحمد محمد"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-1)' }}>
                الدور الوظيفي *
              </label>
              <select
                required
                className="input"
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-1)' }}>
                الفريق
              </label>
              <select
                className="input"
                value={form.team_id}
                onChange={(e) => set('team_id', e.target.value)}
              >
                <option value="">— بدون فريق —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-1)' }}>
              رقم الهاتف
            </label>
            <input
              className="input"
              placeholder="01xxxxxxxxx"
              dir="ltr"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>

          <div
            className="text-xs p-3"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink-2)' }}
          >
            سيتلقى المستخدم بريدًا إلكترونيًا يحتوي على رابط لإنشاء كلمة المرور وتفعيل الحساب.
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="btn-accent flex-1 justify-center"
            >
              {pending ? 'جاري الإرسال...' : 'إرسال الدعوة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm"
              style={{
                background: 'transparent',
                border: '1px solid var(--line)',
                color: 'var(--ink-1)',
                cursor: 'pointer',
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main SettingsClient ──────────────────────────────────────────────────────

export function SettingsClient({ projectId, retentionPct, taxPct, users, teams }: Props) {
  const router = useRouter()

  // Financial settings form state
  const [retention, setRetention]   = useState(retentionPct)
  const [tax, setTax]               = useState(taxPct)
  const [savingFinance, startSave]  = useTransition()
  const [saveMsg, setSaveMsg]       = useState('')

  // Invite modal
  const [showInvite, setShowInvite] = useState(false)

  // User search
  const [userSearch, setUserSearch] = useState('')

  function saveFinancial(e: React.FormEvent) {
    e.preventDefault()
    setSaveMsg('')
    startSave(async () => {
      const res = await fetch('/api/admin/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ project_id: projectId, retention_pct: retention, tax_pct: tax }),
      })
      setSaveMsg(res.ok ? 'تم الحفظ ✓' : 'حدث خطأ')
      if (res.ok) router.refresh()
    })
  }

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.includes(userSearch) ||
      (u.phone ?? '').includes(userSearch)
  )

  return (
    <>
      {/* ─── Financial Settings ──────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--ink-0)' }}>
          الإعدادات المالية
        </h2>

        <form onSubmit={saveFinancial} className="card p-5 space-y-5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-1)' }}>
                نسبة خصم الضمان (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                className="input font-mono"
                value={retention}
                onChange={(e) => setRetention(Number(e.target.value))}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--ink-2)' }}>
                الحالية: {retentionPct}% — تُطبَّق على كل مستخلص
              </p>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-1)' }}>
                ضريبة القيمة المضافة (%)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                step={0.5}
                className="input font-mono"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--ink-2)' }}>
                الحالية: {taxPct}% — تُطبَّق على صافي المستحق
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={savingFinance || !projectId}
              className="btn-accent"
            >
              {savingFinance ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
            {saveMsg && (
              <span
                className="text-xs"
                style={{ color: saveMsg.includes('✓') ? 'var(--success)' : 'var(--danger)' }}
              >
                {saveMsg}
              </span>
            )}
            {!projectId && (
              <span className="text-xs" style={{ color: 'var(--warn)' }}>
                لا يوجد مشروع نشط
              </span>
            )}
          </div>
        </form>
      </section>

      {/* ─── User Management ─────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: 'var(--ink-0)' }}>
            المستخدمون ({users.length})
          </h2>
          <button
            onClick={() => setShowInvite(true)}
            className="btn-accent"
          >
            + دعوة مستخدم
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          className="input"
          style={{ maxWidth: '280px' }}
          placeholder="بحث بالاسم أو الهاتف..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                {['الاسم', 'الدور', 'الفريق', 'الهاتف', 'الحالة', 'تاريخ الانضمام'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-start font-medium"
                    style={{ color: 'var(--ink-1)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const teamObj = teams.find((t) => t.id === u.team_id)
                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: '1px solid var(--line)' }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--bg-3)', color: 'var(--ink-1)' }}
                          >
                            {u.full_name.charAt(0)}
                          </div>
                          <span style={{ color: 'var(--ink-0)' }}>{u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="chip text-xs"
                          style={{
                            color:       ROLE_COLOR[u.role] ?? 'var(--ink-2)',
                            borderColor: `${ROLE_COLOR[u.role] ?? 'var(--line)'}50`,
                          }}
                        >
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--ink-1)' }}>
                        {teamObj ? `${teamObj.code}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--ink-1)' }} dir="ltr">
                        {u.phone ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="chip text-xs"
                          style={{
                            color:       u.is_active ? 'var(--success)' : 'var(--ink-2)',
                            borderColor: u.is_active ? 'rgba(50,213,131,0.3)' : 'var(--line)',
                          }}
                        >
                          {u.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--ink-2)' }}>
                        {new Date(u.created_at).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          teams={teams}
          onClose={() => setShowInvite(false)}
          onSuccess={() => {
            setShowInvite(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
