import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { successResponse, errorResponse } from "@/lib/types/api-response"
import { sanitizeUser } from "@/lib/auth/sanitize"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")
  return successResponse({ user: sanitizeUser(user) })
}
