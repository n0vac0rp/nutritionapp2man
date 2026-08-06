import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { NotFoundError } from "@/lib/errors"
import { handleApiError, successResponse } from "@/lib/api-helpers"
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
