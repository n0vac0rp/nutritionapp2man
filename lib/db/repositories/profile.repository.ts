import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@/generated/prisma/client"

export async function findByUserId(userId: string) {
  return prisma.userProfile.findUnique({ where: { userId } })
}

export async function upsertByUserId(
  userId: string,
  data: Omit<Prisma.UserProfileCreateInput, "user">,
) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
}
