-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "waterGoal" DOUBLE PRECISION NOT NULL DEFAULT 2000;

-- CreateTable
CREATE TABLE "ActivityEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "activityType" TEXT NOT NULL,
    "durationMin" DOUBLE PRECISION NOT NULL,
    "intensity" TEXT NOT NULL,
    "caloriesBurned" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityEntry_userId_date_idx" ON "ActivityEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityEntry_userId_date_key" ON "ActivityEntry"("userId", "date");

-- AddForeignKey
ALTER TABLE "ActivityEntry" ADD CONSTRAINT "ActivityEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
