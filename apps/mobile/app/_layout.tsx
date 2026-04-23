import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { I18nManager } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { initI18n } from '@/lib/i18n'
import { useAuthStore } from '@/lib/auth-store'
import { initSentry } from '@/lib/sentry'
// Must be imported at module scope so TaskManager.defineTask() runs before any background fetch fires
import '@/lib/background-sync'

// Initialize Sentry before any other code runs
initSentry()

// Force RTL for Arabic
I18nManager.forceRTL(true)

export default function RootLayout() {
  const { session, initialize } = useAuthStore()

  useEffect(() => {
    initI18n()
    initialize()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0a0e14" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0e14' } }}>
          {session ? (
            <Stack.Screen name="(app)" />
          ) : (
            <Stack.Screen name="(auth)" />
          )}
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
