import { z } from "zod"

export const waterLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(0).max(50000),
})
