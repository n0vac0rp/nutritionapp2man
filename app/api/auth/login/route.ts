import { NextRequest } from "next/server"
import { loginSchema } from "@/lib/validators/auth.validator"
import { parseBody, handleApiError, successResponse } from "@/lib/api-helpers"
import * as authService from "@/lib/services/auth.service"
import { sanitizeUser } from "@/lib/auth/sanitize"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await parseBody(req, loginSchema)
    const result = await authService.login(email, password)
    return successResponse({ user: sanitizeUser(result.user), token: result.token })
  } catch (err) {
    return handleApiError(err)
  }
}
