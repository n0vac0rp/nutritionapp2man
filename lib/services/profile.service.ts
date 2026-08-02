import * as profileRepo from "@/lib/db/repositories/profile.repository"
import * as userRepo from "@/lib/db/repositories/user.repository"
import { verifyPassword, hashPassword } from "@/lib/auth/password"
import { UnauthorizedError } from "@/lib/errors"

export async function getProfile(userId: string) {
  return profileRepo.findByUserId(userId)
}

export async function updateProfile(userId: string, data: Record<string, unknown>) {
  return profileRepo.upsertByUserId(userId, data as Parameters<typeof profileRepo.upsertByUserId>[1])
}

export async function updateUser(userId: string, data: Record<string, unknown>) {
  return userRepo.update(userId, data as Parameters<typeof userRepo.update>[1])
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await userRepo.findById(userId)
  if (!user) throw new UnauthorizedError("User not found")

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) throw new UnauthorizedError("Current password is incorrect")

  const newHash = await hashPassword(newPassword)
  await userRepo.updatePassword(userId, newHash)
}
