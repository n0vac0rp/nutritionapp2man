import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { handleApiError, successResponse } from "@/lib/api-helpers"
import * as statsRepo from "@/lib/db/repositories/stats.repository"

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const stats = await statsRepo.findByUserId(user.id)
    return successResponse({ stats })
  } catch (err) {
    return handleApiError(err)
  }
}
