import * as sleepRepo from "@/lib/db/repositories/sleep.repository"

export async function getEntries(
  userId: string,
  opts?: { startDate?: string; endDate?: string },
) {
  return sleepRepo.findByUserId(userId, opts)
}

export async function logEntry(
  userId: string,
  date: string,
  data: {
    hoursSlept: number
    sleepQuality: "poor" | "fair" | "good" | "excellent"
    bedTime?: string
    wakeTime?: string
    notes?: string
  },
) {
  return sleepRepo.upsert(userId, date, {
    hoursSlept: data.hoursSlept,
    sleepQuality: data.sleepQuality.toUpperCase() as "POOR" | "FAIR" | "GOOD" | "EXCELLENT",
    bedTime: data.bedTime,
    wakeTime: data.wakeTime,
    notes: data.notes,
  })
}
