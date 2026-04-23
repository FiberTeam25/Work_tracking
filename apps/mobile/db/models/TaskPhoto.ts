import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'

export class TaskPhoto extends Model {
  static table = 'task_photos'

  @field('task_client_id') taskClientId!: string
  @field('local_uri') localUri!: string
  @field('remote_url') remoteUrl!: string | null
  @field('photo_order') photoOrder!: number
  @field('is_uploaded') isUploaded!: boolean
  @field('taken_at') takenAt!: number
}
