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

interface Team {
  id: string
  code: string
  name: string
  supervisor_id: string | null
  project_id: string | null
  is_active: boolean
  created_at: string
}

interface Profile {
  id: string
  full_name: string
  role: string
}

interface Member {
  id: string
  full_name: string
  role: string
  team_id: string | null
  is_active: boolean
}

interface TeamsClientProps {
  teams: Team[]
  supervisorMap: Record<string, Profile>
  membersByTeam: Record<string, Member[]>
  fieldSupervisors: Pick<Profile, 'id' | 'full_name'>[]
  projectId: string
  canManage: boolean
}

// ─── Create Team Modal ────────────────────────────────────────────────────────

interface CreateTeamModalProps {
  fieldSupervisors: Pick<Profile, 'id' | 'full_name'>[]
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

function CreateTeamModal({ fieldSupervisors, projectId, onClose, onSuccess }: CreateTeamModalProps) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    supervisor_id: '',
  })
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          form.name,
          code:          form.code.toUpperCase(),
          supervisor_id: form.supervisor_id || null,
          project_id:    projectId || null,
        }),
      })
      if (res.ok) {
        onSuccess()
      } else {
        const json = await res.json()
        setError(typeof json.error === 'string' ? json.error : 'حدث خطأ')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="w-full max-w-md p-6 space-y-5"
        style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink-0)' }}>
            إنشاء فريق جديد
          </h2>
          <button
            onClick={onClose}
            style={{ color: 'var(--ink-2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-1)' }}>
              اسم الفريق *
            </label>
            <input
              required
              className="input"
              placeholder="مثال: فريق التوصيل الشمالي"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-1)' }}>
              كود الفريق *
            </label>
            <input
              required
              className="input font-mono"
              placeholder="مثال: TEAM-04"
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-1)' }}>
              المشرف الميداني
            </label>
            <select
              className="input"
              value={form.supervisor_id}
              onChange={(e) => set('supervisor_id', e.target.value)}
            >
              <option value="">— بدون مشرف —</option>
              {fieldSupervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="btn-accent flex-1 justify-center"
            >
              {pending ? 'جاري الحفظ...' : 'حفظ الفريق'}
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

// ─── Main TeamsClient ─────────────────────────────────────────────────────────

export function TeamsClient({
  teams,
  supervisorMap,
  membersByTeam,
  fieldSupervisors,
  projectId,
  canManage,
}: TeamsClientProps) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null)

  const totalMembers = Object.values(membersByTeam).reduce((sum, m) => sum + m.length, 0)
  const activeTeams  = teams.filter((t) => t.is_active).length

  function handleSuccess() {
    setShowCreate(false)
    router.refresh()
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink-0)' }}>
            الفرق والمشرفين
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-2)' }}>
            {activeTeams} فريق نشط · {totalMembers} عضو
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="btn-accent"
          >
            + إنشاء فريق
          </button>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'إجمالي الفرق',   value: teams.length,  color: 'var(--ink-0)'    },
          { label: 'فرق نشطة',       value: activeTeams,   color: 'var(--success)'  },
          { label: 'إجمالي الأعضاء', value: totalMembers,  color: 'var(--accent-2)' },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--ink-2)' }}>
              {kpi.label}
            </div>
            <div className="text-3xl font-bold font-mono" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Teams grid */}
      {teams.length === 0 ? (
        <div className="card p-10 text-center text-sm" style={{ color: 'var(--ink-2)' }}>
          لا توجد فرق مسجلة
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {teams.map((team) => {
            const supervisor  = team.supervisor_id ? supervisorMap[team.supervisor_id] : null
            const members     = membersByTeam[team.id] ?? []
            const isExpanded  = expandedTeam === team.id

            const techCount  = members.filter((m) => m.role === 'field_technician').length
            const supvCount  = members.filter((m) => m.role === 'field_supervisor').length

            return (
              <div key={team.id} className="card">
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
                        style={{
                          background: 'rgba(0,212,255,0.1)',
                          color: 'var(--accent-2)',
                          border: '1px solid rgba(0,212,255,0.3)',
                        }}
                      >
                        {team.code.split('-')[1] ?? team.code.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold" style={{ color: 'var(--ink-0)' }}>
                          {team.name}
                        </div>
                        <div className="text-xs font-mono" style={{ color: 'var(--ink-2)' }}>
                          {team.code}
                        </div>
                      </div>
                    </div>
                    <span
                      className="chip text-xs"
                      style={{
                        color: team.is_active ? 'var(--success)' : 'var(--ink-2)',
                        borderColor: team.is_active ? 'rgba(50,213,131,0.4)' : 'var(--line)',
                      }}
                    >
                      {team.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>

                  {/* Supervisor */}
                  <div
                    className="flex items-center gap-2 py-2"
                    style={{ borderTop: '1px solid var(--line)' }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--bg-3)', color: 'var(--ink-1)' }}
                    >
                      {supervisor ? supervisor.full_name.charAt(0) : '—'}
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: 'var(--ink-0)' }}>
                        {supervisor ? supervisor.full_name : 'لم يُعيَّن مشرف'}
                      </div>
                      {supervisor && (
                        <div className="text-xs" style={{ color: 'var(--ink-2)' }}>
                          {ROLE_LABELS[supervisor.role] ?? supervisor.role}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Member summary */}
                  <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--ink-2)' }}>
                    <span>
                      <span className="font-mono font-bold" style={{ color: 'var(--ink-0)' }}>
                        {supvCount}
                      </span>{' '}
                      مشرف
                    </span>
                    <span>
                      <span className="font-mono font-bold" style={{ color: 'var(--ink-0)' }}>
                        {techCount}
                      </span>{' '}
                      فني
                    </span>
                    <span>
                      <span className="font-mono font-bold" style={{ color: 'var(--ink-0)' }}>
                        {members.length}
                      </span>{' '}
                      إجمالي
                    </span>
                  </div>
                </div>

                {/* Expandable member list */}
                {members.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--line)' }}>
                    <button
                      onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                      className="w-full flex items-center justify-between px-5 py-2.5 text-xs"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ink-2)',
                        cursor: 'pointer',
                        textAlign: 'start',
                      }}
                    >
                      <span>عرض الأعضاء ({members.length})</span>
                      <span style={{ fontSize: '10px' }}>{isExpanded ? '▲' : '▼'}</span>
                    </button>

                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--line)' }}>
                        {members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between px-5 py-2 text-xs"
                            style={{ borderBottom: '1px solid var(--line)' }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ background: 'var(--bg-3)', color: 'var(--ink-1)', flexShrink: 0 }}
                              >
                                {m.full_name.charAt(0)}
                              </div>
                              <span style={{ color: 'var(--ink-0)' }}>{m.full_name}</span>
                            </div>
                            <span
                              className="chip"
                              style={{
                                color:       ROLE_COLOR[m.role] ?? 'var(--ink-2)',
                                borderColor: `${ROLE_COLOR[m.role] ?? 'var(--line)'}50`,
                                fontSize:    '10px',
                              }}
                            >
                              {ROLE_LABELS[m.role] ?? m.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreate && (
        <CreateTeamModal
          fieldSupervisors={fieldSupervisors}
          projectId={projectId}
          onClose={() => setShowCreate(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
