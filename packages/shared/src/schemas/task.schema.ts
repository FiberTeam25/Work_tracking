import { z } from 'zod'

export const TaskTypeSchema = z.enum(['route', 'node'])
export const TaskStatusSchema = z.enum(['draft', 'pending', 'approved', 'rejected', 'invoiced'])

export const RouteTaskSchema = z.object({
  task_type: z.literal('route'),
  from_cabinet_id: z.string().uuid(),
  to_box_id: z.string().uuid(),
  route_length_m: z.number().positive('الطول يجب أن يكون رقم موجب'),
})

export const NodeTaskSchema = z.object({
  task_type: z.literal('node'),
  node_cabinet_id: z.string().uuid().optional().nullable(),
  node_box_id: z.string().uuid().optional().nullable(),
  quantity: z.number().int().positive('الكمية يجب أن تكون رقم صحيح موجب'),
})

export const TaskBaseSchema = z.object({
  project_id: z.string().uuid(),
  site_id: z.string().uuid(),
  contract_item_id: z.string().uuid(),
  team_id: z.string().uuid(),
  task_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صحيح'),
  gps_lat: z.number().min(-90).max(90).optional().nullable(),
  gps_lng: z.number().min(-180).max(180).optional().nullable(),
  gps_accuracy_m: z.number().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export const CreateTaskSchema = TaskBaseSchema.and(
  z.discriminatedUnion('task_type', [RouteTaskSchema, NodeTaskSchema])
)

export const MobileTaskSchema = CreateTaskSchema.and(
  z.object({ client_id: z.string().uuid() })
)

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type MobileTaskInput = z.infer<typeof MobileTaskSchema>
