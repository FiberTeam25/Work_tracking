import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env['SENTRY_DSN'] ?? process.env['NEXT_PUBLIC_SENTRY_DSN'],
  enabled: process.env['NODE_ENV'] === 'production',
  tracesSampleRate: 0.1,
  release: process.env['NEXT_PUBLIC_APP_VERSION'] ?? 'unknown',
  environment: process.env['NEXT_PUBLIC_SENTRY_ENV'] ?? 'production',
})
