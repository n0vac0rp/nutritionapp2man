import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { activityLogSchema, activityQuerySchema } from "@/lib/validators/activity.validator"
import { parseBody, parseQuery, handleApiError, successResponse } from "@/lib/api-helpers"
import { getCaloriesPerMinute } from "@/app/data/activities"
import * as activityRepo from "@/lib/db/repositories/activity.repository"

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const query = parseQuery(req, activityQuerySchema)
    const entries = await activityRepo.findByUserId(user.id, {
      startDate: query.startDate,
      endDate: query.endDate,
    })
    return successResponse({ entries })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const { date, ...data } = await parseBody(req, activityLogSchema)
    const caloriesBurned = Math.round(
      data.durationMin * getCaloriesPerMinute(data.activityType, data.intensity) * 10,
    ) / 10
    const entry = await activityRepo.create(user.id, date, { ...data, caloriesBurned })
    return successResponse({ entry }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
