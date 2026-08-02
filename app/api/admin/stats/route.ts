import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import { prisma } from "@/lib/db/prisma"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    if (user.role !== "ADMIN") return errorResponse("Insufficient permissions", 403, "FORBIDDEN")

    const [totalUsers, totalMeals, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.meal.count(),
      prisma.user.count({
        where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      }),
    ])

    return successResponse({ totalUsers, totalMeals, activeUsers })
  } catch (err) {
    return handleApiError(err)
  }
}
