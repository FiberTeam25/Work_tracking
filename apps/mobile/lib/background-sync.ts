import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'
import { syncDatabase } from '@/db/sync'

export const BACKGROUND_SYNC_TASK = 'ftth-background-sync'

// defineTask must be called at module scope — import this file in the app root
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await syncDatabase()
    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch (err) {
    console.warn('[BackgroundSync] task failed:', err)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

export async function registerBackgroundSync(): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync()
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) {
    console.warn('[BackgroundSync] background fetch not available:', status)
    return
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK)
  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    })
  }
}

export async function unregisterBackgroundSync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK)
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK)
  }
}
