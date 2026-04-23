import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],

  // Only send errors in production — keeps noise out of dev/preview
  enabled: process.env['NODE_ENV'] === 'production',

  // 5% of transactions sampled for performance monitoring
  tracesSampleRate: 0.05,

  // Replay 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Tag all events with the app version for easy filtering
  release: process.env['NEXT_PUBLIC_APP_VERSION'] ?? 'unknown',
  environment: process.env['NEXT_PUBLIC_SENTRY_ENV'] ?? 'production',
})
