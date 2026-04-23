import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, teams(name, code)')
    .eq('id', user.id)
    .single()

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
