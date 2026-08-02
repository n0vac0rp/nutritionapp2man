import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as mealsService from "@/lib/services/meals.service"
import * as waterService from "@/lib/services/water.service"
import * as statsService from "@/lib/services/stats.service"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const today = new Date().toISOString().split("T")[0]
    const [meals, water, stats] = await Promise.all([
      mealsService.getMeals(user.id, { date: today }),
      waterService.getTodayIntake(user.id),
      statsService.getStats(user.id),
    ])

    const todayCalories = meals.reduce((s, m) => s + (m.totalNutrition?.calories || 0), 0)

    return successResponse({
      todayCalories,
      todayMeals: meals,
      waterIntake: water,
      currentStreak: stats?.currentStreak || 0,
      achievements: stats?.achievements || [],
    })
  } catch (err) {
    return handleApiError(err)
  }
}
