import { prisma } from "@/lib/db/prisma"

export async function findByUserId(userId: string) {
  return prisma.userStats.findUnique({ where: { userId } })
}

export async function create(userId: string) {
  return prisma.userStats.create({
    data: {
      userId,
      achievements: ["Welcome to NaijaFit!"],
    },
  })
}

export async function update(userId: string, data: {
  totalMealsLogged?: number
  averageDailyCalories?: number
  favoriteFood?: string
  longestStreak?: number
  currentStreak?: number
  achievements?: string[]
}) {
  return prisma.userStats.update({ where: { userId }, data })
}
