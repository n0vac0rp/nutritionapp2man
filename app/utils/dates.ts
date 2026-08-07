/*
 * API responses serialize Prisma `DateTime` fields as full ISO strings
 * ("2026-08-07T00:00:00.000Z"), so comparing them directly against a
 * "YYYY-MM-DD" key never matches. Normalize both sides with toDateKey.
 */

export function toDateKey(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().split("T")[0]
  return value.split("T")[0]
}

export function todayKey(): string {
  return new Date().toISOString().split("T")[0]
}
