import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { updateUserSchema } from "@/lib/validators/user.validator"
import { parseBody, handleApiError, successResponse } from "@/lib/api-helpers"
import { updateUser } from "@/lib/services/profile.service"
import { sanitizeUser } from "@/lib/auth/sanitize"

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const body = await parseBody(req, updateUserSchema)
    const updated = await updateUser(user.id, user.weight, body)

    return successResponse({ user: sanitizeUser(updated) })
  } catch (err) {
    return handleApiError(err)
  }
}
