async function initSentry() {
  try {
    const loadModule = new Function('m', 'return import(m)')
    const Sentry = (await loadModule('@sentry/nextjs')) as {
      init: (options: Record<string, unknown>) => void
      replayIntegration?: (options: Record<string, unknown>) => unknown
    }

    Sentry.init({
      dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],
      enabled: process.env['NODE_ENV'] === 'production',
      tracesSampleRate: 0.05,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: Sentry.replayIntegration
        ? [
            Sentry.replayIntegration({
              maskAllText: false,
              blockAllMedia: false,
            }),
          ]
        : [],
      release: process.env['NEXT_PUBLIC_APP_VERSION'] ?? 'unknown',
      environment: process.env['NEXT_PUBLIC_SENTRY_ENV'] ?? 'production',
    })
  } catch {
    // Sentry is optional when dependencies are not installed locally.
  }
}

void initSentry()
