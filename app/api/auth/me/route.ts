import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { handleApiError, successResponse } from "@/lib/api-helpers"
import { sanitizeUser } from "@/lib/auth/sanitize"

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req)
    return successResponse({ user: sanitizeUser(user) })
  } catch (err) {
    return handleApiError(err)
  }
}
