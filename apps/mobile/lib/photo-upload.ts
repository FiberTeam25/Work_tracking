import * as FileSystem from 'expo-file-system'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/db'
import { TaskPhoto } from '@/db/models/TaskPhoto'
import { supabase } from './supabase'

const BUCKET = 'task-photos'
const MAX_CONCURRENT = 3

async function uploadOne(photo: TaskPhoto): Promise<void> {
  const ext = photo.localUri.split('.').pop() ?? 'jpg'
  const storagePath = `${photo.taskClientId}/${photo.id}_${photo.photoOrder}.${ext}`

  // Fetch blob from local file URI (works in React Native / Hermes)
  const response = await fetch(photo.localUri)
  if (!response.ok) throw new Error(`Cannot read local file: ${photo.localUri}`)
  const blob = await response.blob()

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  })
  if (error) throw error

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

  await database.write(async () => {
    await photo.update((p) => {
      p.remoteUrl = publicUrl
      p.isUploaded = true
    })
  })
}

export async function uploadPendingPhotos(): Promise<{ uploaded: number; failed: number }> {
  const collection = database.get<TaskPhoto>('task_photos')
  const pending = await collection.query(Q.where('is_uploaded', false)).fetch()

  let uploaded = 0
  let failed = 0

  for (let i = 0; i < pending.length; i += MAX_CONCURRENT) {
    const batch = pending.slice(i, i + MAX_CONCURRENT)
    const results = await Promise.allSettled(batch.map(uploadOne))
    for (const result of results) {
      if (result.status === 'fulfilled') {
        uploaded++
      } else {
        failed++
        console.warn('[PhotoUpload] failed:', result.reason)
      }
    }
  }

  return { uploaded, failed }
}

export async function pendingPhotoCount(): Promise<number> {
  const collection = database.get<TaskPhoto>('task_photos')
  return collection.query(Q.where('is_uploaded', false)).fetchCount()
}
