'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-0)' }}
    >
      <div
        className="w-full max-w-sm p-8"
        style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 flex items-center justify-center font-black text-black text-sm font-mono"
            style={{
              background: 'var(--accent)',
              clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)',
            }}
          >
            F
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--ink-0)' }}>
              FieldOps FTTH
            </div>
            <div className="text-xs" style={{ color: 'var(--ink-2)' }}>
              Afro Group · نظام الإدارة
            </div>
          </div>
        </div>

        <h1 className="text-lg font-semibold mb-6" style={{ color: 'var(--ink-0)' }}>
          تسجيل الدخول
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: 'var(--ink-2)' }}
            >
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink-0)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-2"
              style={{ color: 'var(--ink-2)' }}
            >
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink-0)',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div
              className="text-xs p-3"
              style={{
                background: 'rgba(240,68,56,.1)',
                border: '1px solid rgba(240,68,56,.3)',
                color: 'var(--danger)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-bold mt-2 transition-colors"
            style={{
              background: loading ? 'var(--bg-3)' : 'var(--accent)',
              color: '#000',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
