import { NextRequest } from "next/server"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as foodsService from "@/lib/services/foods.service"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const food = await foodsService.getFood(id)
    if (!food) return errorResponse("Food not found", 404, "NOT_FOUND")
    return successResponse({ food })
  } catch (err) {
    return handleApiError(err)
  }
}
