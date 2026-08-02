import { verifyToken } from "@/lib/auth/jwt"
import * as userRepo from "@/lib/db/repositories/user.repository"

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
