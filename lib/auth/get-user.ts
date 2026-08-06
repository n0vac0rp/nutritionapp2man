import { verifyToken } from "@/lib/auth/jwt"
import * as userRepo from "@/lib/db/repositories/user.repository"
import { UnauthorizedError } from "@/lib/errors"

export async function getUserFromRequest(req: Request) {
  const header = req.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null

  try {
    const { userId } = await verifyToken(header.slice(7))
    return userRepo.findById(userId)
  } catch {
    return null
  }
}

export async function requireUser(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) throw new UnauthorizedError()
  return user
}
