"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../contexts/auth-context"
import { api } from "@/lib/api-client"
import { todayKey } from "../utils/dates"

export interface WaterIntake {
  id: string
  userId: string
  date: string
  amount: number
}

export function useWaterToday() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const today = todayKey()

  const key = ["water", user?.id, today]

  const { data: intake = null, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => api.get<{ intake: WaterIntake | null }>("/api/water/today").then((r) => r.intake),
    enabled: !!user,
  })

  const persist = async (amount: number) => {
    if (!user) return { success: false, error: "No user logged in" }
    try {
      queryClient.setQueryData<{ intake: WaterIntake | null }>(key, {
        intake: { id: intake?.id ?? "", userId: user.id, date: today, amount },
      })
      const data = await api.post<{ intake: WaterIntake }>("/api/water", { date: today, amount })
      queryClient.setQueryData<{ intake: WaterIntake | null }>(key, { intake: data.intake })
      queryClient.invalidateQueries({ queryKey: ["water", user?.id] })
      return { success: true }
    } catch (err: any) {
      queryClient.invalidateQueries({ queryKey: ["water", user?.id] })
      return { success: false, error: err?.message || "Failed to update water" }
    }
  }

  return {
    amount: intake?.amount ?? 0,
    isLoading,
    addWater: (amount: number) => persist((intake?.amount ?? 0) + amount),
    removeWater: (amount: number) => persist(Math.max(0, (intake?.amount ?? 0) - amount)),
    refetch: () => queryClient.invalidateQueries({ queryKey: ["water", user?.id] }),
  }
}
