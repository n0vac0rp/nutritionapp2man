import { NextRequest } from "next/server"
import { z } from "zod"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { parseQuery, handleApiError, successResponse, errorResponse } from "@/lib/api-helpers"
import * as userRepo from "@/lib/db/repositories/user.repository"

const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    if (user.role !== "ADMIN") return errorResponse("Insufficient permissions", 403, "FORBIDDEN")

    const { page, limit } = parseQuery(req, querySchema)
    const result = await userRepo.findAllPaginated(page ?? 1, limit ?? 20)
    return successResponse(result)
  } catch (err) {
    return handleApiError(err)
  }
}
