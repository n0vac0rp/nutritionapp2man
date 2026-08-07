"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../contexts/auth-context"
import { api } from "@/lib/api-client"

export interface MealFood {
  id: string; mealId: string; foodId?: string | null; name: string; grams: number
  calories: number; protein: number; carbs: number; fats: number; fiber: number; iron: number; vitaminA: number
}

export interface NutritionTotal {
  id: string; mealId: string; calories: number; protein: number; carbs: number; fats: number; fiber: number; iron: number; vitaminA: number
}

export interface Meal {
  id: string; userId: string; type: string; date: string; time: string
  foods: MealFood[]; totalNutrition: NutritionTotal | null
  mood?: string | null; notes?: string | null; createdAt: string
}

export function useMeals(date?: string, startDate?: string, endDate?: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const params = new URLSearchParams()
  if (date) params.set("date", date)
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  const key = ["meals", user?.id, date, startDate, endDate]

  const { data: meals = [], isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => api.get<{ meals: Meal[] }>(`/api/meals?${params}`).then((r) => r.meals),
    enabled: !!user,
  })

  const addMeal = async (mealData: {
    type: string; date: string; time: string; foods: {
      foodId?: string; name: string; grams: number
      nutrition: { calories: number; protein: number; carbs: number; fats: number; fiber: number; iron: number; vitaminA: number }
    }[]
  }) => {
    if (!user) return { success: false, error: "No user logged in" }
    try {
      const data = await api.post<{ meal: Meal }>("/api/meals", mealData)
      queryClient.invalidateQueries({ queryKey: ["meals", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["stats", user?.id] })
      return { success: true, meal: data.meal }
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to add meal" }
    }
  }

  const deleteMeal = async (mealId: string) => {
    if (!user) return { success: false, error: "No user logged in" }
    try {
      await api.delete(`/api/meals/${mealId}`)
      queryClient.invalidateQueries({ queryKey: ["meals", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["stats", user?.id] })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to delete meal" }
    }
  }

  const updateMeal = async (
    mealId: string,
    mealData: {
      type: string; date: string; time: string; foods: {
        foodId?: string; name: string; grams: number
        nutrition: { calories: number; protein: number; carbs: number; fats: number; fiber: number; iron: number; vitaminA: number }
      }[]
    },
  ) => {
    if (!user) return { success: false, error: "No user logged in" }
    try {
      const data = await api.patch<{ meal: Meal }>(`/api/meals/${mealId}`, mealData)
      queryClient.invalidateQueries({ queryKey: ["meals", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["stats", user?.id] })
      return { success: true, meal: data.meal }
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update meal" }
    }
  }

  return { meals, isLoading, error: error ? String(error) : null, addMeal, deleteMeal, updateMeal, refetch: () => queryClient.invalidateQueries({ queryKey: key }) }
}
