import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import { handleApiError, successResponse } from "@/lib/api-helpers"
import * as userRepo from "@/lib/db/repositories/user.repository"
import * as mealsService from "@/lib/services/meals.service"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireUser(req)
    if (admin.role !== "ADMIN") throw new ForbiddenError()

    const { id } = await params
    const [targetUser, recentMeals] = await Promise.all([
      userRepo.findById(id),
      mealsService.getMeals(id),
    ])

    if (!targetUser) throw new NotFoundError("User")

    return successResponse({ user: targetUser, recentMeals })
  } catch (err) {
    return handleApiError(err)
  }
}
