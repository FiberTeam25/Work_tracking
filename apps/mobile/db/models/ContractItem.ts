import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'

export class ContractItem extends Model {
  static table = 'contract_items'

  @field('server_id') serverId!: string
  @field('group_code') groupCode!: string
  @field('code') code!: string
  @field('description_ar') descriptionAr!: string
  @field('description_en') descriptionEn!: string
  @field('unit') unit!: string
  @field('task_type') taskType!: 'route' | 'node'
  @field('contract_qty') contractQty!: number
  @field('synced_at') syncedAt!: number
}
