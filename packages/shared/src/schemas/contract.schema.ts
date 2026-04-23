import { z } from 'zod'

export const ContractItemImportSchema = z.object({
  code: z.string().min(1),
  description_ar: z.string().min(1),
  description_en: z.string().optional(),
  unit: z.string().min(1),
  task_type: z.enum(['route', 'node']),
  contract_qty: z.number().nonnegative(),
  unit_price: z.number().nonnegative().optional().nullable(),
  sort_order: z.number().int().default(0),
})

export type ContractItemImport = z.infer<typeof ContractItemImportSchema>
