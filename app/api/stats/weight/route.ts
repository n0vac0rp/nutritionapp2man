import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as bmiRepo from "@/lib/db/repositories/bmi-history.repository"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const history = await bmiRepo.findByUserId(user.id)
    return successResponse({ history })
  } catch (err) {
    return handleApiError(err)
  }
}
