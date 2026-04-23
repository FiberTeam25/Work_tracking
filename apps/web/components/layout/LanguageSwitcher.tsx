'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function LanguageSwitcher() {
  const router = useRouter()
  const [locale, setLocale] = useState('ar')

  useEffect(() => {
    const stored = document.cookie.match(/locale=([^;]+)/)?.[1] ?? 'ar'
    setLocale(stored)
  }, [])

  function toggle() {
    const next = locale === 'ar' ? 'en' : 'ar'
    document.cookie = `locale=${next}; path=/; max-age=31536000`
    setLocale(next)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 text-xs font-mono"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        color: 'var(--ink-1)',
        cursor: 'pointer',
        minWidth: '44px',
      }}
    >
      {locale === 'ar' ? 'EN' : 'ع'}
    </button>
  )
}
