import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as statsService from "@/lib/services/stats.service"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const stats = await statsService.getStats(user.id)
    return successResponse({ stats })
  } catch (err) {
    return handleApiError(err)
  }
}
