import { useEffect, useRef, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { syncDatabase } from '@/db/sync'
import { pendingPhotoCount } from '@/lib/photo-upload'
import { registerBackgroundSync } from '@/lib/background-sync'

interface SyncState {
  isSyncing: boolean
  pendingPhotos: number
  lastSyncedAt: Date | null
  error: string | null
}

export function useSync() {
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    pendingPhotos: 0,
    lastSyncedAt: null,
    error: null,
  })
  const isSyncingRef = useRef(false)

  const sync = async () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    setState((s) => ({ ...s, isSyncing: true, error: null }))

    try {
      await syncDatabase()
      const photos = await pendingPhotoCount()
      setState((s) => ({
        ...s,
        isSyncing: false,
        pendingPhotos: photos,
        lastSyncedAt: new Date(),
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      console.warn('[useSync] error:', message)
      setState((s) => ({ ...s, isSyncing: false, error: message }))
    } finally {
      isSyncingRef.current = false
    }
  }

  useEffect(() => {
    // Register background task once (no-op if already registered)
    registerBackgroundSync().catch((e) =>
      console.warn('[useSync] registerBackgroundSync error:', e)
    )

    // Sync on mount if online
    sync()

    // Re-sync whenever connection is restored
    const unsubscribe = NetInfo.addEventListener((netState) => {
      if (netState.isConnected && netState.isInternetReachable && !isSyncingRef.current) {
        sync()
      }
    })

    return unsubscribe
  }, [])

  return { ...state, sync }
}
