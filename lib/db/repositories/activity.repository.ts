import { prisma } from "@/lib/db/prisma"
import type { ActivityIntensity } from "@/app/data/activities"

export async function findByUserId(
  userId: string,
  opts?: { startDate?: string; endDate?: string },
) {
  const where: Record<string, unknown> = { userId }
  if (opts?.startDate || opts?.endDate) {
    where.date = {} as Record<string, Date>
    if (opts?.startDate) (where.date as Record<string, Date>).gte = new Date(opts.startDate)
    if (opts?.endDate) (where.date as Record<string, Date>).lte = new Date(opts.endDate)
  }

  return prisma.activityEntry.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  })
}

export async function findById(id: string) {
  return prisma.activityEntry.findUnique({ where: { id } })
}

export async function create(
  userId: string,
  date: string,
  data: {
    activityType: string
    durationMin: number
    intensity: ActivityIntensity
    caloriesBurned: number
    notes?: string
  },
) {
  return prisma.activityEntry.create({
    data: { userId, date: new Date(date), ...data },
  })
}

export async function remove(id: string) {
  return prisma.activityEntry.delete({ where: { id } })
}
