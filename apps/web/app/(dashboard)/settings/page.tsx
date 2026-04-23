import { createServerClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createServerClient()

  // Active project
  const { data: project } = await supabase
    .from('projects')
    .select('id, code, name_ar, name_en, client, contractor, contract_ref, start_date, end_date, metadata')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  // All profiles for user management
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, role, team_id, is_active, created_at, lang, phone')
    .order('role')
    .order('full_name')

  // All active teams for the invite modal
  const { data: teams } = await supabase
    .from('teams')
    .select('id, code, name')
    .eq('is_active', true)
    .order('code')

  const metadata     = (project?.metadata ?? {}) as Record<string, unknown>
  const retentionPct = typeof metadata['retention_pct'] === 'number' ? metadata['retention_pct'] : 10
  const taxPct       = typeof metadata['tax_pct']       === 'number' ? metadata['tax_pct']       : 1

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      {/* ─── Project Info ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold" style={{ color: 'var(--ink-0)' }}>
          معلومات المشروع
        </h2>

        {project ? (
          <div className="card p-5">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                { label: 'كود المشروع',       value: project.code          },
                { label: 'اسم المشروع',        value: project.name_ar       },
                { label: 'العميل',             value: project.client        },
                { label: 'المقاول',            value: project.contractor    },
                { label: 'رقم العقد',          value: project.contract_ref  },
                { label: 'تاريخ البداية',      value: project.start_date    },
                { label: 'تاريخ النهاية',      value: project.end_date      },
              ].map(({ label, value }) => (
                value ? (
                  <div key={label}>
                    <dt className="text-xs mb-0.5" style={{ color: 'var(--ink-2)' }}>{label}</dt>
                    <dd className="font-medium font-mono" style={{ color: 'var(--ink-0)' }}>{value}</dd>
                  </div>
                ) : null
              ))}
            </dl>
          </div>
        ) : (
          <div className="card p-6 text-sm" style={{ color: 'var(--ink-2)' }}>
            لا يوجد مشروع نشط
          </div>
        )}
      </section>

      {/* ─── Financial + Users (client-interactive) ───────────── */}
      <SettingsClient
        projectId={project?.id ?? ''}
        retentionPct={retentionPct}
        taxPct={taxPct}
        users={users ?? []}
        teams={teams ?? []}
      />
    </div>
  )
}
