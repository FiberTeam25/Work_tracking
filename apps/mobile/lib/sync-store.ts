import { create } from 'zustand'
import { supabase } from './supabase'
import Constants from 'expo-constants'

const API_URL = Constants.expoConfig?.extra?.['apiUrl'] as string

interface LocalTask {
  id: string
  clientId: string
  descriptionAr: string
  taskType: 'route' | 'node'
  routeLengthM?: number
  quantity?: number
  status: string
  taskDate: string
  teamName: string
  isSynced: boolean
  photos: string[]
  gpsLat?: number
  gpsLng?: number
  gpsAccuracyM?: number
  notes?: string
}

interface NewTaskPayload {
  clientId: string
  taskType: 'route' | 'node'
  routeLengthM?: number
  quantity?: number
  taskDate: string
  photos: string[]
  gpsLat?: number
  gpsLng?: number
  gpsAccuracyM?: number
  notes?: string
}

interface SyncState {
  tasks: LocalTask[]
  isSyncing: boolean
  pendingCount: number
  lastSyncedAt: string | null
  addTask: (payload: NewTaskPayload) => Promise<void>
  sync: () => Promise<void>
  refresh: () => Promise<void>
}

// In-memory store — in production this backs to WatermelonDB
export const useSyncStore = create<SyncState>((set, get) => ({
  tasks: [],
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,

  addTask: async (payload) => {
    const newTask: LocalTask = {
      id: payload.clientId,
      clientId: payload.clientId,
      descriptionAr: 'تاسك جديد',
      taskType: payload.taskType,
      routeLengthM: payload.routeLengthM,
      quantity: payload.quantity,
      status: 'pending',
      taskDate: payload.taskDate,
      teamName: 'فريق 2',
      isSynced: false,
      photos: payload.photos,
      gpsLat: payload.gpsLat,
      gpsLng: payload.gpsLng,
      gpsAccuracyM: payload.gpsAccuracyM,
      notes: payload.notes,
    }

    set((state) => ({
      tasks: [...state.tasks, newTask],
      pendingCount: state.pendingCount + 1,
    }))

    // Attempt immediate sync
    get().sync()
  },

  sync: async () => {
    const { isSyncing, tasks, lastSyncedAt } = get()
    if (isSyncing) return

    const pending = tasks.filter((t) => !t.isSynced)
    if (pending.length === 0) return

    set({ isSyncing: true })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { set({ isSyncing: false }); return }

      const response = await fetch(`${API_URL}/api/tasks/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tasks: pending.map((t) => ({
            client_id: t.clientId,
            task_type: t.taskType,
            route_length_m: t.routeLengthM,
            quantity: t.quantity,
            task_date: t.taskDate,
            gps_lat: t.gpsLat,
            gps_lng: t.gpsLng,
            gps_accuracy_m: t.gpsAccuracyM,
            notes: t.notes,
            // project_id, site_id, contract_item_id, team_id come from profile
          })),
          last_synced_at: lastSyncedAt,
        }),
      })

      if (!response.ok) throw new Error(`Sync failed: ${response.status}`)

      const result = await response.json()

      // Mark successfully pushed tasks as synced
      const syncedClientIds = new Set(
        result.pushed
          .filter((r: any) => r.status !== 'error')
          .map((r: any) => r.client_id)
      )

      set((state) => ({
        tasks: state.tasks.map((t) =>
          syncedClientIds.has(t.clientId)
            ? { ...t, isSynced: true, status: 'pending' }
            : t
        ),
        pendingCount: state.tasks.filter((t) => !t.isSynced && !syncedClientIds.has(t.clientId)).length,
        lastSyncedAt: result.server_time,
      }))
    } catch (err) {
      console.warn('Sync error:', err)
    } finally {
      set({ isSyncing: false })
    }
  },

  refresh: async () => {
    await get().sync()
  },
}))
