import { handleApiError, successResponse } from "@/lib/api-helpers"
import * as foodsService from "@/lib/services/foods.service"

export async function GET() {
  try {
    const categories = await foodsService.getCategories()
    return successResponse({ categories })
  } catch (err) {
    return handleApiError(err)
  }
}
