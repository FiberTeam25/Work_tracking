import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'client_id', type: 'string', isIndexed: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'project_id', type: 'string', isOptional: true },
        { name: 'contract_item_id', type: 'string', isOptional: true },
        { name: 'team_id', type: 'string', isOptional: true },
        { name: 'task_type', type: 'string' }, // 'route' | 'node'
        { name: 'task_date', type: 'string' },
        { name: 'route_length_m', type: 'number', isOptional: true },
        { name: 'quantity', type: 'number', isOptional: true },
        { name: 'gps_lat', type: 'number', isOptional: true },
        { name: 'gps_lng', type: 'number', isOptional: true },
        { name: 'gps_accuracy_m', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'pending_sync' | 'pending' | 'approved' | 'rejected'
        { name: 'is_synced', type: 'boolean' },
        { name: 'synced_at', type: 'number', isOptional: true },
        { name: 'created_at_unix', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'task_photos',
      columns: [
        { name: 'task_client_id', type: 'string', isIndexed: true },
        { name: 'local_uri', type: 'string' },
        { name: 'remote_url', type: 'string', isOptional: true },
        { name: 'photo_order', type: 'number' }, // 0=before 1=after
        { name: 'is_uploaded', type: 'boolean' },
        { name: 'taken_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'contract_items',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'group_code', type: 'string' },
        { name: 'code', type: 'string' },
        { name: 'description_ar', type: 'string' },
        { name: 'description_en', type: 'string' },
        { name: 'unit', type: 'string' },
        { name: 'task_type', type: 'string' },
        { name: 'contract_qty', type: 'number' },
        { name: 'synced_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'cabinets',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string' },
        { name: 'code', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'gps_lat', type: 'number', isOptional: true },
        { name: 'gps_lng', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'synced_at', type: 'number' },
      ],
    }),
  ],
})
