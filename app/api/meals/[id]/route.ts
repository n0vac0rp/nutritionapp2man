import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as mealsService from "@/lib/services/meals.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const { id } = await params
    const meal = await mealsService.getMeal(id)
    if (!meal || meal.userId !== user.id) return errorResponse("Meal not found", 404, "NOT_FOUND")
    return successResponse({ meal })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const { id } = await params
    const meal = await mealsService.getMeal(id)
    if (!meal || meal.userId !== user.id) return errorResponse("Meal not found", 404, "NOT_FOUND")

    await mealsService.deleteMeal(id)
    return successResponse(null)
  } catch (err) {
    return handleApiError(err)
  }
}
