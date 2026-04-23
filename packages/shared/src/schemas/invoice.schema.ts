import { z } from 'zod'

export const GenerateInvoiceSchema = z.object({
  site_id: z.string().uuid(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  retention_pct: z.number().min(0).max(100).default(10),
  tax_pct: z.number().min(0).max(100).default(1),
})

export type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceSchema>
