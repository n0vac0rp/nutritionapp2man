import * as mealRepo from "@/lib/db/repositories/meal.repository"
import * as statsRepo from "@/lib/db/repositories/stats.repository"

export async function getMeals(
  userId: string,
  opts?: { date?: string; startDate?: string; endDate?: string; type?: string },
) {
  if (opts?.date) {
    return mealRepo.findByUserIdAndDate(userId, opts.date)
  }
  return mealRepo.findByUserId(userId, {
    startDate: opts?.startDate,
    endDate: opts?.endDate,
    type: opts?.type,
  })
}

export async function getMeal(id: string) {
  return mealRepo.findById(id)
}

export async function createMeal(data: Parameters<typeof mealRepo.create>[0]) {
  const meal = await mealRepo.create(data)
  await recalcStats(data.userId)
  return meal
}

export async function deleteMeal(id: string) {
  const meal = await mealRepo.findById(id)
  if (!meal) return
  await mealRepo.remove(id)
  await recalcStats(meal.userId)
}

async function recalcStats(userId: string) {
  const [total, distinctDays, meals] = await Promise.all([
    mealRepo.countByUserId(userId),
    mealRepo.countDistinctDatesByUserId(userId),
    mealRepo.findByUserId(userId),
  ])

  const totalCal = meals.reduce((s, m) => s + (m.totalNutrition?.calories ?? 0), 0)
  const avgCal = distinctDays > 0 ? totalCal / distinctDays : 0

  const foodCounts: Record<string, number> = {}
  for (const m of meals) {
    for (const f of m.foods) {
      foodCounts[f.name] = (foodCounts[f.name] || 0) + 1
    }
  }
  const sorted = Object.entries(foodCounts).sort(([, a], [, b]) => b - a)
  const favoriteFood = sorted[0]?.[0] || "Not determined yet"

  const dates = [...new Set(meals.map((m) => m.date.toISOString().split("T")[0]))].sort()
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 1
  const today = new Date().toISOString().split("T")[0]

  for (let i = dates.length - 1; i >= 0; i--) {
    const expected = new Date()
    expected.setDate(expected.getDate() - (dates.length - 1 - i))
    if (dates[i] === expected.toISOString().split("T")[0]) {
      currentStreak = tempStreak
      tempStreak++
    } else {
      break
    }
  }

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) { tempStreak++ } else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1 }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  const stats = await statsRepo.findByUserId(userId)
  const achievements = stats?.achievements || []
  if (total >= 1 && !achievements.includes("First Meal Logged")) achievements.push("First Meal Logged")
  if (total >= 10 && !achievements.includes("Consistent Logger")) achievements.push("Consistent Logger")
  if (currentStreak >= 7 && !achievements.includes("Week Warrior")) achievements.push("Week Warrior")
  if (longestStreak >= 30 && !achievements.includes("Monthly Master")) achievements.push("Monthly Master")

  await statsRepo.update(userId, {
    totalMealsLogged: total,
    averageDailyCalories: Math.round(avgCal),
    favoriteFood,
    currentStreak,
    longestStreak,
    achievements,
  })
}
