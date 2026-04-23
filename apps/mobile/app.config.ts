import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'FieldOps FTTH',
  slug: 'ftth-fieldops',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0a0e14',
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0e14',
    },
    package: 'com.agrogroup.ftthfieldops',
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.INTERNET',
    ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    '@sentry/react-native/expo',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'يحتاج التطبيق للوصول للموقع لتسجيل إحداثيات التاسكات',
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'يحتاج التطبيق للكاميرا لالتقاط صور الأعمال المنفذة',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#ff7a1a',
      },
    ],
  ],
  scheme: 'ftth-fieldops',
  extra: {
    eas: {
      projectId: 'YOUR_EAS_PROJECT_ID',
    },
    supabaseUrl: process.env['EXPO_PUBLIC_SUPABASE_URL'],
    supabaseAnonKey: process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    apiUrl: process.env['EXPO_PUBLIC_API_URL'],
    sentryDsn: process.env['EXPO_PUBLIC_SENTRY_DSN'],
  },
}

export default config
