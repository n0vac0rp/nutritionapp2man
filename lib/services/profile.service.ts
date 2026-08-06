import * as userRepo from "@/lib/db/repositories/user.repository"
import * as bmiRepo from "@/lib/db/repositories/bmi-history.repository"
import type { Prisma } from "@/generated/prisma/client"

export async function updateUser(
  userId: string,
  currentWeight: number | null,
  data: Prisma.UserUpdateInput,
) {
  const updated = await userRepo.update(userId, data)

  const weight = data.weight as number | undefined
  if (weight !== undefined && Math.abs(weight - (currentWeight ?? 0)) > 0.01) {
    const height = data.height as number | undefined
    const bmi = height ? Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10 : undefined
    await bmiRepo.create({
      userId,
      date: new Date().toISOString().split("T")[0],
      weight,
      bmi,
    })
  }

  return updated
}
