import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { updateProfileSchema } from "@/lib/validators/profile.validator"
import { parseBody, handleApiError, successResponse } from "@/lib/api-helpers"
import * as profileRepo from "@/lib/db/repositories/profile.repository"

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const profile = await profileRepo.findByUserId(user.id)
    return successResponse({ profile })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const body = await parseBody(req, updateProfileSchema)
    const profile = await profileRepo.upsertByUserId(user.id, {
      ...body,
      activityLevel: body.activityLevel?.toUpperCase() as "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE",
      units: body.units?.toUpperCase() as "METRIC" | "IMPERIAL",
    })
    return successResponse({ profile })
  } catch (err) {
    return handleApiError(err)
  }
}
