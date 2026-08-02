import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

export async function findById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } })
}

export async function create(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data })
}

export async function update(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data })
}

export async function updatePassword(id: string, passwordHash: string) {
  return prisma.user.update({ where: { id }, data: { passwordHash } })
}

export async function findAllPaginated(page: number, limit: number) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ])
  return { users, total, page, totalPages: Math.ceil(total / limit) }
}
