import { prisma } from "@/lib/db/prisma"
import type { Prisma } from "@prisma/client"

const mealInclude = {
  foods: true,
  totalNutrition: true,
} as const

export async function findByUserId(
  userId: string,
  opts?: { startDate?: string; endDate?: string; type?: string },
) {
  const where: Prisma.MealWhereInput = { userId }
  if (opts?.startDate) where.date = { ...(where.date as object), gte: new Date(opts.startDate) }
  if (opts?.endDate) where.date = { ...(where.date as object), lte: new Date(opts.endDate) }
  if (opts?.type) where.type = opts.type as Prisma.EnumMealTypeFilter["equals"]

  return prisma.meal.findMany({
    where,
    include: mealInclude,
    orderBy: { date: "desc" },
  })
}

export async function findByUserIdAndDate(userId: string, date: string) {
  return prisma.meal.findMany({
    where: { userId, date: new Date(date) },
    include: mealInclude,
    orderBy: { createdAt: "desc" },
  })
}

export async function findById(id: string) {
  return prisma.meal.findUnique({ where: { id }, include: mealInclude })
}

export async function create(data: {
  userId: string
  type: Prisma.EnumMealTypeFilter["equals"]
  date: string
  time: string
  mood?: string
  notes?: string
  foods: {
    foodId?: string
    name: string
    grams: number
    calories: number
    protein: number
    carbs: number
    fats: number
    fiber: number
    iron: number
    vitaminA: number
  }[]
}) {
  const totalCalories = data.foods.reduce((s, f) => s + f.calories, 0)
  const totalProtein = data.foods.reduce((s, f) => s + f.protein, 0)
  const totalCarbs = data.foods.reduce((s, f) => s + f.carbs, 0)
  const totalFats = data.foods.reduce((s, f) => s + f.fats, 0)
  const totalFiber = data.foods.reduce((s, f) => s + f.fiber, 0)
  const totalIron = data.foods.reduce((s, f) => s + f.iron, 0)
  const totalVitaminA = data.foods.reduce((s, f) => s + f.vitaminA, 0)

  return prisma.meal.create({
    data: {
      userId: data.userId,
      type: data.type as Prisma.MealCreateInput["type"],
      date: new Date(data.date),
      time: data.time,
      mood: data.mood as Prisma.MealCreateInput["mood"],
      notes: data.notes,
      foods: {
        create: data.foods.map((f) => ({
          foodId: f.foodId || null,
          name: f.name,
          grams: f.grams,
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fats: f.fats,
          fiber: f.fiber,
          iron: f.iron,
          vitaminA: f.vitaminA,
        })),
      },
      totalNutrition: {
        create: {
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fats: totalFats,
          fiber: totalFiber,
          iron: totalIron,
          vitaminA: totalVitaminA,
        },
      },
    },
    include: mealInclude,
  })
}

export async function remove(id: string) {
  return prisma.meal.delete({ where: { id } })
}

export async function countByUserId(userId: string) {
  return prisma.meal.count({ where: { userId } })
}

export async function countDistinctDatesByUserId(userId: string) {
  const result = await prisma.meal.findMany({
    where: { userId },
    select: { date: true },
    distinct: ["date"],
  })
  return result.length
}
