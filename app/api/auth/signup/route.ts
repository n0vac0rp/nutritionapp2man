import { NextRequest } from "next/server"
import { signupSchema } from "@/lib/validators/auth.validator"
import { parseBody, handleApiError, successResponse } from "@/lib/api-helpers"
import * as authService from "@/lib/services/auth.service"
import { sanitizeUser } from "@/lib/auth/sanitize"

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, signupSchema)
    const result = await authService.signup(body)
    return successResponse({ user: sanitizeUser(result.user), token: result.token }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
