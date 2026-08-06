import { z } from "zod"

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  age: z.number().int().min(1).max(120).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  height: z.number().min(50).max(300).optional(),
  weight: z.number().min(20).max(500).optional(),
  waistCircumference: z.number().min(30).max(300).optional(),
  hipCircumference: z.number().min(30).max(300).optional(),
  fistCircumference: z.number().min(5).max(50).optional(),
  location: z.string().max(200).optional(),
  occupation: z.string().max(200).optional(),
  healthConditions: z.array(z.string()).optional(),
  fitnessGoals: z.array(z.string()).optional(),
})
