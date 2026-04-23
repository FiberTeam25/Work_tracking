'use client'

import { useEffect } from 'react'

async function captureWithSentry(error: Error) {
  try {
    const loadModule = new Function('m', 'return import(m)')
    const Sentry = (await loadModule('@sentry/nextjs')) as {
      captureException?: (error: Error) => void
    }
    Sentry.captureException?.(error)
  } catch {
    // Sentry is optional during local development/build verification.
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    void captureWithSentry(error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body style={{ background: '#0a0e14', color: '#e8edf3', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
          <h2 style={{ color: '#f04438', marginBottom: 8, fontSize: 18 }}>حدث خطأ غير متوقع</h2>
          <p style={{ color: '#6b7788', fontSize: 13, marginBottom: 24 }}>
            تم إرسال تقرير الخطأ تلقائياً. يمكنك المحاولة مجدداً.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#ff7a1a',
              color: '#000',
              border: 'none',
              padding: '8px 24px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  )
}
