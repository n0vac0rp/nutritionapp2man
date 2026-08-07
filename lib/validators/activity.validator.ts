import { z } from "zod"

export const activityLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activityType: z.string().min(1).max(100),
  durationMin: z.number().min(1).max(1440),
  intensity: z.enum(["light", "moderate", "vigorous"]),
  notes: z.string().max(500).optional(),
})

export const activityQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})
