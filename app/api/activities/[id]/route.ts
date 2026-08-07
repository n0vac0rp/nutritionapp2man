import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { NotFoundError } from "@/lib/errors"
import { handleApiError, successResponse } from "@/lib/api-helpers"
import * as activityRepo from "@/lib/db/repositories/activity.repository"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req)

    const { id } = await params
    const entry = await activityRepo.findById(id)
    if (!entry || entry.userId !== user.id) throw new NotFoundError("Activity")

    await activityRepo.remove(id)
    return successResponse({ deleted: true })
  } catch (err) {
    return handleApiError(err)
  }
}
