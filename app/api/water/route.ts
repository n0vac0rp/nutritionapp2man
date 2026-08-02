import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { waterLogSchema } from "@/lib/validators/water.validator"
import { parseBody, handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as waterService from "@/lib/services/water.service"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const intakes = await waterService.getIntakeHistory(user.id)
    return successResponse({ intakes })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const { date, amount } = await parseBody(req, waterLogSchema)
    const intake = await waterService.logIntake(user.id, date, amount)
    return successResponse({ intake })
  } catch (err) {
    return handleApiError(err)
  }
}
