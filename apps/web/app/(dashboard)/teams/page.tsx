import { createServerClient } from '@/lib/supabase/server'
import { TeamsClient } from '@/components/teams/TeamsClient'

export const revalidate = 30

export default async function TeamsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const canManage = ['admin', 'project_manager'].includes(currentProfile?.role ?? '')

  // Fetch all teams
  const { data: teams } = await supabase
    .from('teams')
    .select('id, code, name, supervisor_id, project_id, is_active, created_at')
    .order('code')

  // Resolve supervisors via separate query (FK: teams.supervisor_id → profiles.id)
  const supervisorIds = (teams ?? [])
    .filter((t) => t.supervisor_id != null)
    .map((t) => t.supervisor_id!)

  const { data: supervisors } = supervisorIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', supervisorIds)
    : { data: [] }

  // Fetch active members for all teams (for member counts + lists)
  const teamIds = (teams ?? []).map((t) => t.id)

  const { data: members } = teamIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, role, team_id, is_active')
        .in('team_id', teamIds)
        .eq('is_active', true)
        .order('role')
        .order('full_name')
    : { data: [] }

  // Field supervisors available for team assignment
  const { data: fieldSupervisors } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'field_supervisor')
    .eq('is_active', true)
    .order('full_name')

  // Active project (for team creation)
  const { data: project } = await supabase
    .from('projects')
    .select('id, code, name_ar')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  const supervisorMap = Object.fromEntries((supervisors ?? []).map((s) => [s.id, s]))

  type MemberRow = NonNullable<typeof members>[number]
  const membersByTeam = (members ?? []).reduce<Record<string, MemberRow[]>>((acc, m) => {
    if (!m.team_id) return acc
    ;(acc[m.team_id] ??= []).push(m)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <TeamsClient
        teams={teams ?? []}
        supervisorMap={supervisorMap}
        membersByTeam={membersByTeam}
        fieldSupervisors={fieldSupervisors ?? []}
        projectId={project?.id ?? ''}
        canManage={canManage}
      />
    </div>
  )
}
