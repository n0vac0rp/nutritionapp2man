import { prisma } from "@/lib/db/prisma"

export async function findTodayByUserId(userId: string) {
  const today = new Date().toISOString().split("T")[0]
  return prisma.waterIntake.findUnique({
    where: { userId_date: { userId, date: new Date(today) } },
  })
}

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

  return prisma.waterIntake.findMany({
    where,
    orderBy: { date: "desc" },
  })
}

export async function upsert(userId: string, date: string, amount: number) {
  return prisma.waterIntake.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    create: { userId, date: new Date(date), amount },
    update: { amount },
  })
}
