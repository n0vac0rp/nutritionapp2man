import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { createMealSchema, mealsQuerySchema } from "@/lib/validators/meals.validator"
import { parseBody, parseQuery, handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as mealsService from "@/lib/services/meals.service"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const query = parseQuery(req, mealsQuerySchema)
    const meals = await mealsService.getMeals(user.id, {
      ...query,
      type: query.type?.toUpperCase(),
    })
    return successResponse({ meals })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const body = await parseBody(req, createMealSchema)
    const meal = await mealsService.createMeal({
      userId: user.id,
      type: body.type.toUpperCase() as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
      date: body.date,
      time: body.time,
      foods: body.foods.map((f) => ({
        foodId: f.foodId,
        name: f.name,
        grams: f.grams,
        calories: f.nutrition.calories,
        protein: f.nutrition.protein,
        carbs: f.nutrition.carbs,
        fats: f.nutrition.fats,
        fiber: f.nutrition.fiber,
        iron: f.nutrition.iron,
        vitaminA: f.nutrition.vitaminA,
      })),
      mood: body.mood?.toUpperCase() as "GREAT" | "GOOD" | "OKAY" | "POOR" | undefined,
      notes: body.notes,
    })
    return successResponse({ meal }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
