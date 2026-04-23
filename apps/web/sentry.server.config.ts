async function initSentry() {
  try {
    const loadModule = new Function('m', 'return import(m)')
    const Sentry = (await loadModule('@sentry/nextjs')) as {
      init: (options: Record<string, unknown>) => void
    }

    Sentry.init({
      dsn: process.env['SENTRY_DSN'] ?? process.env['NEXT_PUBLIC_SENTRY_DSN'],
      enabled: process.env['NODE_ENV'] === 'production',
      tracesSampleRate: 0.1,
      release: process.env['NEXT_PUBLIC_APP_VERSION'] ?? 'unknown',
      environment: process.env['NEXT_PUBLIC_SENTRY_ENV'] ?? 'production',
      captureUnhandledRejections: true,
    })
  } catch {
    // Sentry is optional when dependencies are not installed locally.
  }
}

void initSentry()
