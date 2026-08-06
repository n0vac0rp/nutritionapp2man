import { NextRequest } from "next/server"
import { requireUser } from "@/lib/auth/get-user"
import { handleApiError } from "@/lib/api-helpers"
import * as mealsService from "@/lib/services/meals.service"
import * as profileRepo from "@/lib/db/repositories/profile.repository"
import * as statsRepo from "@/lib/db/repositories/stats.repository"
import { sanitizeUser } from "@/lib/auth/sanitize"

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req)

    const [meals, profile, stats] = await Promise.all([
      mealsService.getMeals(user.id),
      profileRepo.findByUserId(user.id),
      statsRepo.findByUserId(user.id),
    ])

    const data = {
      user: sanitizeUser(user),
      meals,
      profile,
      stats,
      exportDate: new Date().toISOString(),
    }

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gluguide-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (err) {
    return handleApiError(err)
  }
}
