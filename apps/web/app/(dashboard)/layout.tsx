import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Database } from '@ftth/db-types'
import { cookies } from 'next/headers'

type DashboardProfile = Database['public']['Tables']['profiles']['Row'] & {
  teams: { name: string; code: string } | null
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const isDemo = cookieStore.get('ftth_demo')?.value === '1'

  if (isDemo) {
    const demoProfile: DashboardProfile = {
      id: 'demo-user',
      full_name: 'Demo Supervisor',
      role: 'project_manager',
      team_id: null,
      can_see_prices: true,
      lang: 'en',
      phone: null,
      avatar_url: null,
      is_active: true,
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      teams: { name: 'Demo Team', code: 'TEAM-DEMO' },
    }

    return (
      <div
        className="grid h-screen overflow-hidden"
        style={{ gridTemplateColumns: '260px 1fr', gridTemplateRows: '56px 1fr' }}
      >
        <Topbar profile={demoProfile} />
        <Sidebar role={demoProfile.role} />
        <main
          className="overflow-y-auto"
          style={{ background: 'var(--bg-0)', gridColumn: 2, gridRow: 2 }}
        >
          {children}
        </main>
      </div>
    )
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, teams(name, code)')
    .eq('id', user.id)
    .single()

  const profile = profileData as DashboardProfile | null
  if (!profile) redirect('/login')

  return (
    <div
      className="grid h-screen overflow-hidden"
      style={{ gridTemplateColumns: '260px 1fr', gridTemplateRows: '56px 1fr' }}
    >
      <Topbar profile={profile} />
      <Sidebar role={profile.role} />
      <main
        className="overflow-y-auto"
        style={{ background: 'var(--bg-0)', gridColumn: 2, gridRow: 2 }}
      >
        {children}
      </main>
    </div>
  )
}
