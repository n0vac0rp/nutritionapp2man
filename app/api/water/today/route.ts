import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { handleApiError, successResponse } from "@/lib/api-helpers"
import * as waterRepo from "@/lib/db/repositories/water.repository"

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const intake = await waterRepo.findTodayByUserId(user.id)
    return successResponse({ intake })
  } catch (err) {
    return handleApiError(err)
  }
}
