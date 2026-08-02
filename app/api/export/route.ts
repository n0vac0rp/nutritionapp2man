import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { handleApiError, errorResponse } from "@/lib/api-helpers"
import * as mealsService from "@/lib/services/meals.service"
import * as profileService from "@/lib/services/profile.service"
import * as statsService from "@/lib/services/stats.service"
import { sanitizeUser } from "@/lib/auth/sanitize"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const [meals, profile, stats] = await Promise.all([
      mealsService.getMeals(user.id),
      profileService.getProfile(user.id),
      statsService.getStats(user.id),
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
