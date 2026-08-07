"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../contexts/auth-context"
import { api } from "@/lib/api-client"

export interface ActivityEntry {
  id: string
  userId: string
  date: string
  activityType: string
  durationMin: number
  intensity: "light" | "moderate" | "vigorous"
  caloriesBurned: number
  notes?: string | null
  createdAt: string
}

export function useActivities(startDate?: string, endDate?: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  const key = ["activities", user?.id, startDate, endDate]

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () =>
      api
        .get<{ entries: ActivityEntry[] }>(`/api/activities?${params}`)
        .then((r) => r.entries),
    enabled: !!user,
  })

  const logActivity = async (data: {
    date: string
    activityType: string
    durationMin: number
    intensity: "light" | "moderate" | "vigorous"
    notes?: string
  }) => {
    if (!user) return { success: false, error: "No user logged in" }
    try {
      const res = await api.post<{ entry: ActivityEntry }>("/api/activities", data)
      queryClient.invalidateQueries({ queryKey: ["activities", user.id] })
      queryClient.invalidateQueries({ queryKey: ["stats", user.id] })
      return { success: true, entry: res.entry }
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to log activity" }
    }
  }

  const deleteActivity = async (id: string) => {
    if (!user) return { success: false, error: "No user logged in" }
    try {
      await api.delete(`/api/activities/${id}`)
      queryClient.invalidateQueries({ queryKey: ["activities", user.id] })
      queryClient.invalidateQueries({ queryKey: ["stats", user.id] })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to delete activity" }
    }
  }

  return {
    entries,
    isLoading,
    error: error ? String(error) : null,
    logActivity,
    deleteActivity,
    refetch: () => queryClient.invalidateQueries({ queryKey: key }),
  }
}
