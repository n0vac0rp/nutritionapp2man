import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { updateUserSchema } from "@/lib/validators/profile.validator"
import { parseBody, handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as profileService from "@/lib/services/profile.service"
import { sanitizeUser } from "@/lib/auth/sanitize"
import * as bmiRepo from "@/lib/db/repositories/bmi-history.repository"

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const body = await parseBody(req, updateUserSchema)
    const updated = await profileService.updateUser(user.id, body)

    if (body.weight !== undefined && Math.abs(body.weight - user.weight) > 0.01) {
      const bmi = body.height ? Math.round((body.weight / Math.pow(body.height / 100, 2)) * 10) / 10 : undefined
      await bmiRepo.create({
        userId: user.id,
        date: new Date().toISOString().split("T")[0],
        weight: body.weight,
        bmi,
      })
    }

    return successResponse({ user: sanitizeUser(updated) })
  } catch (err) {
    return handleApiError(err)
  }
}
