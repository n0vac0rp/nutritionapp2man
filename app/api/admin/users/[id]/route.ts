import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as userRepo from "@/lib/db/repositories/user.repository"
import * as mealsService from "@/lib/services/meals.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getUserFromRequest(req)
    if (!admin) return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    if (admin.role !== "ADMIN") return errorResponse("Insufficient permissions", 403, "FORBIDDEN")

    const { id } = await params
    const [targetUser, recentMeals] = await Promise.all([
      userRepo.findById(id),
      mealsService.getMeals(id),
    ])

    if (!targetUser) return errorResponse("User not found", 404, "NOT_FOUND")

    return successResponse({ user: targetUser, recentMeals })
  } catch (err) {
    return handleApiError(err)
  }
}
