import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { sleepLogSchema } from "@/lib/validators/sleep.validator"
import { parseBody, handleApiError, successResponse } from "@/lib/api-helpers"
import * as sleepRepo from "@/lib/db/repositories/sleep.repository"

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const entries = await sleepRepo.findByUserId(user.id)
    return successResponse({ entries })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const { date, ...data } = await parseBody(req, sleepLogSchema)
    const entry = await sleepRepo.upsert(user.id, date, data)
    return successResponse({ entry })
  } catch (err) {
    return handleApiError(err)
  }
}
