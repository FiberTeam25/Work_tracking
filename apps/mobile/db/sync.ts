import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from './index'
import { supabase } from '@/lib/supabase'
import { uploadPendingPhotos } from '@/lib/photo-upload'
import Constants from 'expo-constants'

const API_URL = Constants.expoConfig?.extra?.['apiUrl'] as string

export async function syncDatabase(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  await synchronize({
    database,

    pullChanges: async ({ lastPulledAt }) => {
      const response = await fetch(
        `${API_URL}/api/sync/pull?last_pulled_at=${lastPulledAt ?? 0}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      )
      if (!response.ok) throw new Error(`Pull failed: ${response.status}`)
      const { changes, timestamp } = await response.json()
      return { changes, timestamp }
    },

    pushChanges: async ({ changes, lastPulledAt }) => {
      const response = await fetch(`${API_URL}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ changes, lastPulledAt }),
      })
      if (!response.ok) throw new Error(`Push failed: ${response.status}`)
    },

    migrationsEnabledAtVersion: 1,
    sendCreatedAsUpdated: false,
  })

  // Upload any photos that were saved offline while the task sync completed
  await uploadPendingPhotos()
}
