import { z } from "zod"

export const signupSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8),
  age: z.number().int().min(1).max(120),
  gender: z.enum(["male", "female", "other"]),
  height: z.number().min(50).max(300),
  weight: z.number().min(20).max(500),
  waistCircumference: z.number().min(30).max(300).optional(),
  hipCircumference: z.number().min(30).max(300).optional(),
  fistCircumference: z.number().min(5).max(50),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
