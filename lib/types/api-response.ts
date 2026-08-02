import { NextResponse } from "next/server"

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } satisfies ApiSuccessResponse<T>, { status })
}

export function errorResponse(error: string, status: number, code?: string) {
  return NextResponse.json(
    { success: false, error, ...(code ? { code } : {}) } satisfies ApiErrorResponse,
    { status },
  )
}
