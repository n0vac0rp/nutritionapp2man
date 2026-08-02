import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { changePasswordSchema } from "@/lib/validators/profile.validator"
import { parseBody, handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as profileService from "@/lib/services/profile.service"

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const { currentPassword, newPassword } = await parseBody(req, changePasswordSchema)
    await profileService.changePassword(user.id, currentPassword, newPassword)
    return successResponse(null)
  } catch (err) {
    return handleApiError(err)
  }
}
