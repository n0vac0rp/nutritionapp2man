import { prisma } from "@/lib/db/prisma"

export async function findAll(opts?: {
  search?: string
  category?: string
  page?: number
  limit?: number
}) {
  const page = opts?.page || 1
  const limit = opts?.limit || 20
  const where: Record<string, unknown> = {}

  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: "insensitive" } },
      { description: { contains: opts.search, mode: "insensitive" } },
    ]
  }
  if (opts?.category) where.category = opts.category

  const [foods, total] = await Promise.all([
    prisma.nigerianFood.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.nigerianFood.count({ where }),
  ])

  return { foods, total, page, totalPages: Math.ceil(total / limit) }
}

export async function findById(id: string) {
  return prisma.nigerianFood.findUnique({ where: { id } })
}

export async function findAllCategories() {
  const results = await prisma.nigerianFood.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  })
  return results.map((r) => r.category)
}
