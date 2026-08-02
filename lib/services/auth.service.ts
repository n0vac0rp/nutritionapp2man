import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { signToken } from "@/lib/auth/jwt"
import * as userRepo from "@/lib/db/repositories/user.repository"
import * as profileRepo from "@/lib/db/repositories/profile.repository"
import * as statsRepo from "@/lib/db/repositories/stats.repository"
import { UnauthorizedError, ValidationError } from "@/lib/errors"

export async function signup(data: {
  fullName: string
  email: string
  password: string
  age: number
  gender: "male" | "female" | "other"
  height: number
  weight: number
  waistCircumference?: number
  hipCircumference?: number
  fistCircumference: number
}) {
  const existing = await userRepo.findByEmail(data.email)
  if (existing) throw new ValidationError("User with this email already exists")

  const passwordHash = await hashPassword(data.password)

  const user = await userRepo.create({
    email: data.email.toLowerCase(),
    fullName: data.fullName,
    age: data.age,
    gender: data.gender,
    height: data.height,
    weight: data.weight,
    waistCircumference: data.waistCircumference,
    hipCircumference: data.hipCircumference,
    fistCircumference: data.fistCircumference,
    passwordHash,
  })

  await profileRepo.upsertByUserId(user.id, {})
  await statsRepo.create(user.id)

  const token = await signToken(user.id)
  return { user, token }
}

export async function login(email: string, password: string) {
  const user = await userRepo.findByEmail(email)
  if (!user) throw new UnauthorizedError("Invalid email or password")

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw new UnauthorizedError("Invalid email or password")

  await userRepo.update(user.id, { lastLoginAt: new Date() })

  const token = await signToken(user.id)
  return { user, token }
}
