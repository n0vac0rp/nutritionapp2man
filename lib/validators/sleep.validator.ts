import { z } from "zod"

export const sleepLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hoursSlept: z.number().min(0).max(24),
  sleepQuality: z.enum(["poor", "fair", "good", "excellent"]),
  bedTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
})
