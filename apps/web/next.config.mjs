import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@ftth/shared', '@ftth/ui'],
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

const withIntl = withNextIntl(nextConfig)

async function buildConfig() {
  if (process.env.SENTRY_ORG) {
    const { withSentryConfig } = await import('@sentry/nextjs')
    return withSentryConfig(withIntl, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
      autoInstrumentServerFunctions: true,
      autoInstrumentMiddleware: true,
      autoInstrumentAppDirectory: true,
    })
  }

  return withIntl
}

export default buildConfig()
