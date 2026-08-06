import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { waterLogSchema } from "@/lib/validators/water.validator"
import { parseBody, handleApiError, successResponse } from "@/lib/api-helpers"
import * as waterRepo from "@/lib/db/repositories/water.repository"

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const intakes = await waterRepo.findByUserId(user.id)
    return successResponse({ intakes })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const { date, amount } = await parseBody(req, waterLogSchema)
    const intake = await waterRepo.upsert(user.id, date, amount)
    return successResponse({ intake })
  } catch (err) {
    return handleApiError(err)
  }
}
