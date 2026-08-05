import "dotenv/config"
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

prisma.nigerianFood
  .count()
  .then((count) => process.exit(count > 0 ? 0 : 1))
  .catch((e) => {
    console.error(e)
    process.exit(2)
  })
  .finally(() => prisma.$disconnect())