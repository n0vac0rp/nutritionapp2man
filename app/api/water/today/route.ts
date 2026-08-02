import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as waterService from "@/lib/services/water.service"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const intake = await waterService.getTodayIntake(user.id)
    return successResponse({ intake })
  } catch (err) {
    return handleApiError(err)
  }
}
