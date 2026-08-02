import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { sleepLogSchema } from "@/lib/validators/sleep.validator"
import { parseBody, handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as sleepService from "@/lib/services/sleep.service"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const entries = await sleepService.getEntries(user.id)
    return successResponse({ entries })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const { date, ...data } = await parseBody(req, sleepLogSchema)
    const entry = await sleepService.logEntry(user.id, date, data)
    return successResponse({ entry })
  } catch (err) {
    return handleApiError(err)
  }
}
