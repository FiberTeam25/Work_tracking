import * as Sentry from '@sentry/react-native'
import Constants from 'expo-constants'

const DSN = Constants.expoConfig?.extra?.['sentryDsn'] as string | undefined

export function initSentry(): void {
  if (!DSN) return

  Sentry.init({
    dsn: DSN,
    enabled: !__DEV__,

    // 10% of transactions sampled — mobile battery cost consideration
    tracesSampleRate: 0.1,

    // Tag releases with the Expo app version for regression tracking
    release: Constants.expoConfig?.version ?? 'unknown',
    dist: Constants.expoConfig?.android?.buildNumber?.toString() ?? '1',
    environment: __DEV__ ? 'development' : 'production',

    // Capture JS errors and native crashes
    enableNativeCrashHandling: true,
    enableNativeNagger: false,

    // Attach device info (model, OS version) to all events
    attachScreenshot: false,
  })
}

export { Sentry }
