import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { ForbiddenError } from "@/lib/errors"
import { handleApiError, successResponse } from "@/lib/api-helpers"
import * as userRepo from "@/lib/db/repositories/user.repository"
import * as mealRepo from "@/lib/db/repositories/meal.repository"

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req)
    if (user.role !== "ADMIN") throw new ForbiddenError()

    const [totalUsers, totalMeals, activeUsers] = await Promise.all([
      userRepo.count(),
      mealRepo.count(),
      userRepo.countActiveSince(new Date(Date.now() - 7 * 86400000)),
    ])

    return successResponse({ totalUsers, totalMeals, activeUsers })
  } catch (err) {
    return handleApiError(err)
  }
}
