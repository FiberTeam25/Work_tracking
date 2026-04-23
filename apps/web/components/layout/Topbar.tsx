'use client'

import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { Database } from '@ftth/db-types'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  teams: { name: string; code: string } | null
}

export function Topbar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createBrowserClient()

  async function signOut() {
    document.cookie = 'ftth_demo=; Path=/; Max-Age=0; SameSite=Lax'
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <header
      className="flex items-center gap-6 px-5 col-span-2"
      style={{
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--line)',
        gridColumn: '1 / 3',
        gridRow: 1,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 grid place-items-center font-black text-xs text-black font-mono flex-shrink-0"
          style={{
            background: 'var(--accent)',
            clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
          }}
        >
          F
        </div>
        <div>
          <div className="font-bold text-sm leading-none" style={{ color: 'var(--ink-0)' }}>
            FieldOps FTTH
          </div>
          <div className="text-xs leading-none mt-0.5" style={{ color: 'var(--ink-2)' }}>
            v0.1 · PRODUCTION
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--line)' }} />

      {/* Active project pill */}
      <button
        className="flex items-center gap-2.5 px-3.5 py-1.5 text-xs cursor-pointer"
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--line)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
        <span style={{ color: 'var(--ink-0)' }}>موقع المتميز</span>
        <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>
          FBR-2026-01
        </span>
        <span style={{ color: 'var(--ink-2)' }}>⌄</span>
      </button>

      <div className="flex-1" />

      {/* Language switcher */}
      <LanguageSwitcher />

      {/* Search */}
      <button
        className="px-3 py-1.5 text-xs flex items-center gap-1.5"
        style={{
          background: 'transparent',
          border: '1px solid var(--line)',
          color: 'var(--ink-1)',
          cursor: 'pointer',
        }}
      >
        ⌕ بحث
      </button>

      {/* Notifications */}
      <button
        className="px-3 py-1.5 text-xs flex items-center gap-1.5"
        style={{
          background: 'transparent',
          border: '1px solid var(--line)',
          color: 'var(--ink-1)',
          cursor: 'pointer',
        }}
      >
        🔔
        <span
          className="font-mono text-xs px-1 py-px"
          style={{
            background: 'var(--danger)',
            color: '#fff',
            borderRadius: '2px',
          }}
        >
          3
        </span>
      </button>

      {/* User chip */}
      <button
        onClick={signOut}
        className="flex items-center gap-2.5 px-2.5 py-1 text-xs"
        style={{ border: '1px solid var(--line)', cursor: 'pointer' }}
        title="تسجيل الخروج"
      >
        <div
          className="w-7 h-7 grid place-items-center font-bold text-xs text-black"
          style={{
            background: 'linear-gradient(135deg, var(--accent), #c45a0e)',
            borderRadius: '2px',
          }}
        >
          {initials}
        </div>
        <div>
          <div className="font-medium" style={{ color: 'var(--ink-0)' }}>
            {profile.full_name}
          </div>
          <div style={{ color: 'var(--ink-2)', fontSize: '10px' }}>{profile.role}</div>
        </div>
      </button>
    </header>
  )
}
