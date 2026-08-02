import { prisma } from "@/lib/db/prisma"
import { successResponse, errorResponse } from "@/lib/types/api-response"

export async function GET() {
  let dbStatus = "disconnected"

  try {
    await prisma.$queryRaw`SELECT 1`
    dbStatus = "connected"
  } catch {
    dbStatus = "disconnected"
  }

  return successResponse({
    status: dbStatus === "connected" ? "ok" : "degraded",
    name: "GluGuide API",
    version: "0.1.0",
    db: dbStatus,
    timestamp: new Date().toISOString(),
  })
}
