export interface User {
  id: string
  email: string
  fullName: string
  age: number
  gender: "male" | "female" | "other"
  height: number
  weight: number
  waistCircumference?: number
  hipCircumference?: number
  fistCircumference?: number
  location?: string
  occupation?: string
  healthConditions?: string[]
  fitnessGoals?: string[]
  role: "user" | "admin"
  createdAt: string
  updatedAt: string
  lastLoginAt: string
}

export interface UserProfile {
  userId: string
  preferences: {
    culturalBackground: string[]
    dietaryRestrictions: string[]
    activityLevel: "sedentary" | "light" | "moderate" | "active"
    healthGoals: string[]
    favoriteNigerianFoods: string[]
    mealPreferences: {
      breakfast: string[]
      lunch: string[]
      dinner: string[]
      snacks: string[]
    }
  }
  settings: {
    notifications: boolean
    dataSharing: boolean
    units: "metric" | "imperial"
    reminderTimes: {
      breakfast: string
      lunch: string
      dinner: string
    }
    weeklyGoals: {
      calorieTarget: number
      proteinTarget: number
      exerciseDays: number
    }
  }
  personalizedRecommendations: {
    suggestedFoods: string[]
    avoidFoods: string[]
    mealPlanPreferences: string
    supplementSuggestions: string[]
  }
  updatedAt: string
}

export interface Meal {
  id: string
  userId: string
  type: "breakfast" | "lunch" | "dinner" | "snack"
  date: string
  time: string
  foods: MealFood[]
  totalNutrition: NutritionValues
  mood?: "great" | "good" | "okay" | "poor"
  notes?: string
  createdAt: string
}

export interface MealFood {
  id: string
  name: string
  grams: number
  nutrition: NutritionValues
}

export interface NutritionValues {
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  iron: number
  vitaminA: number
}

export interface UserStats {
  userId: string
  totalMealsLogged: number
  averageDailyCalories: number
  favoriteFood: string
  longestStreak: number
  currentStreak: number
  weightProgress: { date: string; weight: number }[]
  achievements: string[]
  lastUpdated: string
}

export interface SleepEntry {
  id: string
  userId: string
  date: string
  hoursSlept: number
  sleepQuality: "poor" | "fair" | "good" | "excellent"
  bedTime?: string
  wakeTime?: string
  notes?: string
  createdAt: string
}

export interface WaterIntake {
  id: string
  userId: string
  date: string
  amount: number
  createdAt: string
  updatedAt: string
}
