import { z } from "zod"

const nutritionSchema = z.object({
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(1000),
  fats: z.number().min(0).max(500),
  fiber: z.number().min(0).max(100),
  iron: z.number().min(0).max(100),
  vitaminA: z.number().min(0).max(50000),
})

const foodSchema = z.object({
  foodId: z.string().optional(),
  name: z.string().min(1).max(200),
  grams: z.number().min(1).max(10000),
  nutrition: nutritionSchema,
})

export const createMealSchema = z.object({
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  foods: z.array(foodSchema).min(1).max(50),
  mood: z.enum(["great", "good", "okay", "poor"]).optional(),
  notes: z.string().max(500).optional(),
})

export const mealsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
})
