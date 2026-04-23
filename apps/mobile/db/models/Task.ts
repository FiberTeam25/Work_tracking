import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export class Task extends Model {
  static table = 'tasks'

  @field('client_id') clientId!: string
  @field('server_id') serverId!: string | null
  @field('project_id') projectId!: string | null
  @field('contract_item_id') contractItemId!: string | null
  @field('team_id') teamId!: string | null
  @field('task_type') taskType!: 'route' | 'node'
  @field('task_date') taskDate!: string
  @field('route_length_m') routeLengthM!: number | null
  @field('quantity') quantity!: number | null
  @field('gps_lat') gpsLat!: number | null
  @field('gps_lng') gpsLng!: number | null
  @field('gps_accuracy_m') gpsAccuracyM!: number | null
  @field('notes') notes!: string | null
  @field('status') status!: string
  @field('is_synced') isSynced!: boolean
  @field('synced_at') syncedAt!: number | null
  @field('created_at_unix') createdAtUnix!: number
}
