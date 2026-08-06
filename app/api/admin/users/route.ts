import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { ForbiddenError } from "@/lib/errors"
import { parseQuery, handleApiError, successResponse } from "@/lib/api-helpers"
import { paginationSchema } from "@/lib/validators/pagination.validator"
import * as userRepo from "@/lib/db/repositories/user.repository"

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req)
    if (user.role !== "ADMIN") throw new ForbiddenError()

    const { page, limit } = parseQuery(req, paginationSchema)
    const result = await userRepo.findAllPaginated(page, limit)
    return successResponse(result)
  } catch (err) {
    return handleApiError(err)
  }
}
