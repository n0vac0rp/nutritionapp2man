import { getHealth } from "@/lib/api-client/model-client"
import { successResponse, errorResponse } from "@/lib/types/api-response"

export async function GET() {
  try {
    const health = await getHealth()
    return successResponse(health)
  } catch (err) {
    return errorResponse("Model service unavailable", 502, "MODEL_UNAVAILABLE")
  }
}
