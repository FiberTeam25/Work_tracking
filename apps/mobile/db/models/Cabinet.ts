import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'

export class Cabinet extends Model {
  static table = 'cabinets'

  @field('server_id') serverId!: string
  @field('site_id') siteId!: string
  @field('code') code!: string
  @field('type') type!: string
  @field('gps_lat') gpsLat!: number | null
  @field('gps_lng') gpsLng!: number | null
  @field('status') status!: string
  @field('synced_at') syncedAt!: number
}
