import { NextRequest } from "next/server"
import { predict, ModelServiceError } from "@/lib/api-client/model-client"
import { successResponse, errorResponse } from "@/lib/api-helpers"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return errorResponse("Invalid form data", 400, "INVALID_FORM_DATA")
  }

  const file = formData.get("file") as File | null

  if (!file || file.size === 0) {
    return errorResponse("No image file provided", 400, "NO_IMAGE")
  }

  if (file.size > MAX_FILE_SIZE) {
    return errorResponse("Image exceeds maximum size of 10 MB", 413, "FILE_TOO_LARGE")
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return errorResponse(
      `Unsupported image format. Accepted: JPEG, PNG, WebP`,
      400,
      "UNSUPPORTED_FORMAT",
    )
  }

  try {
    const result = await predict(file)
    return successResponse(result)
  } catch (err) {
    if (err instanceof ModelServiceError) {
      return errorResponse(
        err.message || "Model service error",
        err.status === 504 ? 504 : 502,
        err.status === 504 ? "MODEL_TIMEOUT" : "MODEL_UNAVAILABLE",
      )
    }
    return errorResponse("Classification failed", 500, "INFERENCE_ERROR")
  }
}
