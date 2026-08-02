import { NextRequest } from "next/server"
import { z } from "zod"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { parseQuery, handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as mealsService from "@/lib/services/meals.service"

const querySchema = z.object({
  period: z.coerce.number().int().min(1).max(90).optional().default(7),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const { period } = parseQuery(req, querySchema)
    const endDate = new Date().toISOString().split("T")[0]
    const startDate = new Date(Date.now() - ((period ?? 7) - 1) * 86400000).toISOString().split("T")[0]

    const meals = await mealsService.getMeals(user.id, { startDate, endDate })

    const totalCalories = meals.reduce((s, m) => s + (m.totalNutrition?.calories || 0), 0)
    const totalProtein = meals.reduce((s, m) => s + (m.totalNutrition?.protein || 0), 0)
    const totalFiber = meals.reduce((s, m) => s + (m.totalNutrition?.fiber || 0), 0)
    const totalIron = meals.reduce((s, m) => s + (m.totalNutrition?.iron || 0), 0)
    const totalCarbs = meals.reduce((s, m) => s + (m.totalNutrition?.carbs || 0), 0)
    const totalFats = meals.reduce((s, m) => s + (m.totalNutrition?.fats || 0), 0)

    const uniqueDays = new Set(meals.map((m) => m.date.toISOString().split("T")[0])).size || 1

    const dailyBreakdown: Record<string, { calories: number; protein: number; carbs: number; fats: number; meals: number }> = {}
    for (const m of meals) {
      const d = m.date.toISOString().split("T")[0]
      if (!dailyBreakdown[d]) dailyBreakdown[d] = { calories: 0, protein: 0, carbs: 0, fats: 0, meals: 0 }
      dailyBreakdown[d].calories += m.totalNutrition?.calories || 0
      dailyBreakdown[d].protein += m.totalNutrition?.protein || 0
      dailyBreakdown[d].carbs += m.totalNutrition?.carbs || 0
      dailyBreakdown[d].fats += m.totalNutrition?.fats || 0
      dailyBreakdown[d].meals++
    }

    const totalMacros = totalCarbs + totalProtein + totalFats || 1

    return successResponse({
      avgDailyCalories: Math.round(totalCalories / uniqueDays),
      avgDailyProtein: Math.round(totalProtein / uniqueDays),
      avgDailyFiber: Math.round(totalFiber / uniqueDays),
      avgDailyIron: Math.round(totalIron * 10) / 10,
      macroDistribution: {
        carbsPct: Math.round((totalCarbs / totalMacros) * 100),
        proteinPct: Math.round((totalProtein / totalMacros) * 100),
        fatsPct: Math.round((totalFats / totalMacros) * 100),
      },
      dailyBreakdown: Object.entries(dailyBreakdown).map(([date, d]) => ({
        date,
        mealCount: d.meals,
        calories: d.calories,
        protein: d.protein,
        carbs: d.carbs,
        fats: d.fats,
      })),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
