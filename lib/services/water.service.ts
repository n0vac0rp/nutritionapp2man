import * as waterRepo from "@/lib/db/repositories/water.repository"

export async function getTodayIntake(userId: string) {
  const today = new Date().toISOString().split("T")[0]
  return waterRepo.findByUserIdAndDate(userId, today)
}

export async function logIntake(userId: string, date: string, amount: number) {
  return waterRepo.upsert(userId, date, amount)
}

export async function getIntakeHistory(
  userId: string,
  opts?: { startDate?: string; endDate?: string },
) {
  return waterRepo.findByUserId(userId, opts)
}
