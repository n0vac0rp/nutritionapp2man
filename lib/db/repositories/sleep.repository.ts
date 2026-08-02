import { prisma } from "@/lib/db/prisma"

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

  return prisma.sleepEntry.findMany({
    where,
    orderBy: { date: "desc" },
  })
}

export async function upsert(
  userId: string,
  date: string,
  data: {
    hoursSlept: number
    sleepQuality: "POOR" | "FAIR" | "GOOD" | "EXCELLENT"
    bedTime?: string
    wakeTime?: string
    notes?: string
  },
) {
  return prisma.sleepEntry.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    create: { userId, date: new Date(date), ...data },
    update: data,
  })
}
