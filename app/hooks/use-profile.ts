"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../contexts/auth-context"
import { api } from "@/lib/api-client"

export interface UserProfile {
  id: string; userId: string
  culturalBackground: string[]; dietaryRestrictions: string[]
  activityLevel: string; healthGoals: string[]; favoriteFoods: string[]
  breakfastFoods: string[]; lunchFoods: string[]; dinnerFoods: string[]; snackFoods: string[]
  notifications: boolean; dataSharing: boolean; units: string
  breakfastReminderTime: string | null; lunchReminderTime: string | null; dinnerReminderTime: string | null
  weeklyCalorieTarget: number | null; weeklyProteinTarget: number | null; weeklyExerciseDays: number | null
  suggestedFoods: string[]; avoidFoods: string[]; mealPlanPreference: string | null; supplementSuggestions: string[]
  waterGoal: number
  updatedAt: string
}

export function useProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => api.get<{ profile: UserProfile }>("/api/profile").then((r) => r.profile),
    enabled: !!user,
  })

  const updateProfile = async (profileData: Record<string, unknown>) => {
    if (!user) return { success: false, error: "No user logged in" }
    try {
      await api.patch("/api/profile", profileData)
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to update profile" }
    }
  }

  return { profile: profile ?? null, isLoading, error: error ? String(error) : null, updateProfile, refetch: () => queryClient.invalidateQueries({ queryKey: ["profile", user?.id] }) }
}
