import * as statsRepo from "@/lib/db/repositories/stats.repository"

export async function getStats(userId: string) {
  return statsRepo.findByUserId(userId)
}
