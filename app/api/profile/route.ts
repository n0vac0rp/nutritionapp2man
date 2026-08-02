import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { updateProfileSchema } from "@/lib/validators/profile.validator"
import { parseBody, handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as profileService from "@/lib/services/profile.service"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const profile = await profileService.getProfile(user.id)
    return successResponse({ profile })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const body = await parseBody(req, updateProfileSchema)
    const profile = await profileService.updateProfile(user.id, body)
    return successResponse({ profile })
  } catch (err) {
    return handleApiError(err)
  }
}
