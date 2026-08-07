import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { NotFoundError } from "@/lib/errors"
import { createMealSchema } from "@/lib/validators/meals.validator"
import { parseBody, handleApiError, successResponse } from "@/lib/api-helpers"
import * as mealsService from "@/lib/services/meals.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req)

    const { id } = await params
    const meal = await mealsService.getMeal(id)
    if (!meal || meal.userId !== user.id) throw new NotFoundError("Meal")
    return successResponse({ meal })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req)

    const { id } = await params
    const meal = await mealsService.getMeal(id)
    if (!meal || meal.userId !== user.id) throw new NotFoundError("Meal")

    await mealsService.deleteMeal(id)
    return successResponse(null)
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req)

    const { id } = await params
    const meal = await mealsService.getMeal(id)
    if (!meal || meal.userId !== user.id) throw new NotFoundError("Meal")

    const body = await parseBody(req, createMealSchema)
    const updated = await mealsService.updateMeal(id, user.id, {
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
    return successResponse({ meal: updated })
  } catch (err) {
    return handleApiError(err)
  }
}
