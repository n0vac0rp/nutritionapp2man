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

  return prisma.bMIHistory.findMany({
    where,
    orderBy: { date: "desc" },
  })
}

export async function create(entry: {
  userId: string
  date: string
  weight: number
  bmi?: number
}) {
  return prisma.bMIHistory.create({
    data: {
      userId: entry.userId,
      date: new Date(entry.date),
      weight: entry.weight,
      bmi: entry.bmi,
    },
  })
}
