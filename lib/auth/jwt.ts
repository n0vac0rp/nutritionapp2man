import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production",
)

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, SECRET)
  return { userId: payload.sub! }
}
