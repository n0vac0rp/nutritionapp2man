import { NextRequest } from "next/server"
import { ZodSchema, ZodError } from "zod"
import { AppError, ValidationError } from "@/lib/errors"
import { errorResponse, successResponse } from "@/lib/types/api-response"

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  try {
    const body = await req.json()
    return schema.parse(body)
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ValidationError(err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "))
    }
    throw new ValidationError("Invalid request body")
  }
}

export function parseQuery<T>(req: NextRequest, schema: ZodSchema<T>): T {
  const params: Record<string, string> = {}
  req.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value
  })
  try {
    return schema.parse(params)
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ValidationError(err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "))
    }
    throw new ValidationError("Invalid query parameters")
  }
}

export function handleApiError(err: unknown) {
  if (err instanceof AppError) {
    return errorResponse(err.message, err.statusCode, err.code)
  }
  console.error("Unhandled error:", err)
  return errorResponse("Internal server error", 500, "INTERNAL_ERROR")
}

export { successResponse, errorResponse }
