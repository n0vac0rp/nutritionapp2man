-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE');

-- CreateEnum
CREATE TYPE "Units" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('GREAT', 'GOOD', 'OKAY', 'POOR');

-- CreateEnum
CREATE TYPE "SleepQuality" AS ENUM ('POOR', 'FAIR', 'GOOD', 'EXCELLENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "waistCircumference" DOUBLE PRECISION,
    "hipCircumference" DOUBLE PRECISION,
    "location" TEXT,
    "occupation" TEXT,
    "healthConditions" TEXT[],
    "fitnessGoals" TEXT[],
    "role" "Role" NOT NULL DEFAULT 'USER',
    "passwordHash" TEXT NOT NULL,
    "tutorialCompleted" BOOLEAN NOT NULL DEFAULT false,
    "appRated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "culturalBackground" TEXT[],
    "dietaryRestrictions" TEXT[],
    "activityLevel" "ActivityLevel" NOT NULL DEFAULT 'MODERATE',
    "healthGoals" TEXT[],
    "favoriteFoods" TEXT[],
    "breakfastFoods" TEXT[],
    "lunchFoods" TEXT[],
    "dinnerFoods" TEXT[],
    "snackFoods" TEXT[],
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "dataSharing" BOOLEAN NOT NULL DEFAULT false,
    "units" "Units" NOT NULL DEFAULT 'METRIC',
    "breakfastReminderTime" TEXT DEFAULT '07:00',
    "lunchReminderTime" TEXT DEFAULT '12:00',
    "dinnerReminderTime" TEXT DEFAULT '19:00',
    "weeklyCalorieTarget" DOUBLE PRECISION DEFAULT 2000,
    "weeklyProteinTarget" DOUBLE PRECISION DEFAULT 100,
    "weeklyExerciseDays" INTEGER DEFAULT 3,
    "suggestedFoods" TEXT[],
    "avoidFoods" TEXT[],
    "mealPlanPreference" TEXT DEFAULT 'balanced_nigerian',
    "supplementSuggestions" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MealType" NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "mood" "Mood",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealFood" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "foodId" TEXT,
    "name" TEXT NOT NULL,
    "grams" DOUBLE PRECISION NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fats" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION NOT NULL,
    "iron" DOUBLE PRECISION NOT NULL,
    "vitaminA" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MealFood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionTotal" (
    "id" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fats" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION NOT NULL,
    "iron" DOUBLE PRECISION NOT NULL,
    "vitaminA" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "NutritionTotal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NigerianFood" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "servingSize" TEXT NOT NULL,
    "servingWeight" DOUBLE PRECISION NOT NULL,
    "caloriesPer100g" DOUBLE PRECISION NOT NULL,
    "proteinPer100g" DOUBLE PRECISION NOT NULL,
    "carbsPer100g" DOUBLE PRECISION NOT NULL,
    "fatsPer100g" DOUBLE PRECISION NOT NULL,
    "fiberPer100g" DOUBLE PRECISION NOT NULL,
    "ironPer100g" DOUBLE PRECISION NOT NULL,
    "vitaminAPer100g" DOUBLE PRECISION NOT NULL,
    "portionCalSmall" DOUBLE PRECISION NOT NULL,
    "portionCalMedium" DOUBLE PRECISION NOT NULL,
    "portionCalLarge" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "NigerianFood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalMealsLogged" INTEGER NOT NULL DEFAULT 0,
    "averageDailyCalories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "favoriteFood" TEXT DEFAULT 'Not determined yet',
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "achievements" TEXT[],
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterIntake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaterIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hoursSlept" DOUBLE PRECISION NOT NULL,
    "sleepQuality" "SleepQuality" NOT NULL,
    "bedTime" TEXT,
    "wakeTime" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SleepEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodPrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topClassName" TEXT NOT NULL,
    "topConfidence" DOUBLE PRECISION NOT NULL,
    "allPredictions" JSONB NOT NULL,
    "inferenceTimeMs" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BMIHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION,

    CONSTRAINT "BMIHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "Meal_userId_date_idx" ON "Meal"("userId", "date");

-- CreateIndex
CREATE INDEX "Meal_userId_createdAt_idx" ON "Meal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MealFood_mealId_idx" ON "MealFood"("mealId");

-- CreateIndex
CREATE INDEX "MealFood_foodId_idx" ON "MealFood"("foodId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionTotal_mealId_key" ON "NutritionTotal"("mealId");

-- CreateIndex
CREATE INDEX "NigerianFood_category_idx" ON "NigerianFood"("category");

-- CreateIndex
CREATE INDEX "NigerianFood_name_idx" ON "NigerianFood"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");

-- CreateIndex
CREATE INDEX "WaterIntake_userId_date_idx" ON "WaterIntake"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WaterIntake_userId_date_key" ON "WaterIntake"("userId", "date");

-- CreateIndex
CREATE INDEX "SleepEntry_userId_date_idx" ON "SleepEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SleepEntry_userId_date_key" ON "SleepEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "FoodPrediction_userId_createdAt_idx" ON "FoodPrediction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "BMIHistory_userId_date_idx" ON "BMIHistory"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BMIHistory_userId_date_key" ON "BMIHistory"("userId", "date");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealFood" ADD CONSTRAINT "MealFood_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealFood" ADD CONSTRAINT "MealFood_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "NigerianFood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionTotal" ADD CONSTRAINT "NutritionTotal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterIntake" ADD CONSTRAINT "WaterIntake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepEntry" ADD CONSTRAINT "SleepEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodPrediction" ADD CONSTRAINT "FoodPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BMIHistory" ADD CONSTRAINT "BMIHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
