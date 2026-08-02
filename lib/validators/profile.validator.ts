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

export const updateProfileSchema = z.object({
  culturalBackground: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active"]).optional(),
  healthGoals: z.array(z.string()).optional(),
  favoriteFoods: z.array(z.string()).optional(),
  breakfastFoods: z.array(z.string()).optional(),
  lunchFoods: z.array(z.string()).optional(),
  dinnerFoods: z.array(z.string()).optional(),
  snackFoods: z.array(z.string()).optional(),
  notifications: z.boolean().optional(),
  dataSharing: z.boolean().optional(),
  units: z.enum(["metric", "imperial"]).optional(),
  breakfastReminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  lunchReminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dinnerReminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  weeklyCalorieTarget: z.number().min(500).max(10000).optional(),
  weeklyProteinTarget: z.number().min(10).max(500).optional(),
  weeklyExerciseDays: z.number().int().min(0).max(7).optional(),
  suggestedFoods: z.array(z.string()).optional(),
  avoidFoods: z.array(z.string()).optional(),
  mealPlanPreference: z.string().optional(),
  supplementSuggestions: z.array(z.string()).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})
