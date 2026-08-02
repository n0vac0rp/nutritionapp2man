# Backend Contract & Data Architecture — GluGuide

> **Audience:** Backend engineers implementing the remaining phases
> **Date:** August 2026
> **Status:** Specification — no code has been written against this document yet
> **Source of truth:** This document supersedes the API architecture sections in `docs/architecture-plan.md` for all backend implementation details

---

## 1. Executive Summary

GluGuide is a Nigerian nutrition monitoring application. The frontend (Next.js, React 19, Tailwind v4, shadcn/ui) is fully built and currently persists all data to browser `localStorage`. The AI food classifier (FastAPI, PyTorch EfficientNet-B0, 4-class Nigerian starchy food model) is built and integrated via Next.js Route Handler proxies.

**The remaining work** is replacing localStorage with a PostgreSQL database, implementing authentication, and exposing every data operation as a Next.js Route Handler under `app/api/`.

**Architecture decisions already made (non-negotiable):**
- Backend lives inside the Next.js application as Route Handlers — no separate Express service
- Database: PostgreSQL
- ORM: Prisma
- Validation: Zod (shared between frontend forms and Route Handlers)
- Auth: JWT (jsonwebtoken + bcrypt)
- API style: REST, JSON responses with `{ success: boolean, data?: T, error?: string, code?: string }`

---

## 2. Feature Inventory

Every feature in the application, its purpose, user interaction, persistence requirement, and relationship to other features.

### 2.1 Authentication

| Attribute | Detail |
|---|---|
| **Purpose** | User registration, login, session management |
| **Current implementation** | `app/contexts/auth-context.tsx` — plaintext passwords in localStorage |
| **User interaction** | Login form (email + password), Signup form (fullName, email, password, age, gender, height, weight, waist? , hip?) |
| **Persistence** | Users table, password hashes |
| **Relationships** | User is the root entity — all other entities link via `userId` |
| **Components** | `auth-page.tsx`, `auth-context.tsx` |

### 2.2 Profile Management

| Attribute | Detail |
|---|---|
| **Purpose** | Store and update user personal info, health metrics, dietary preferences, settings |
| **Current implementation** | `LocalDatabase.getUserProfile()`, `LocalDatabase.updateUserProfile()`, `LocalDatabase.updateUser()` |
| **User interaction** | Edit name, email, age, height, weight, gender, waist, hip, location, occupation, health conditions, fitness goals, cultural food preferences, dietary restrictions, activity level, health goals, favorite foods, meal preferences, notification settings, data sharing, units, reminder times, weekly goals |
| **Persistence** | Users table + UserProfiles table (1:1) |
| **Relationships** | Belongs to User |
| **Components** | `profile-settings.tsx`, `user-profile-details.tsx`, `bmi-calculator.tsx` |

### 2.3 Meal Logging

| Attribute | Detail |
|---|---|
| **Purpose** | Log food consumed at each meal with nutrition tracking |
| **Current implementation** | `LocalDatabase.createMeal()`, `LocalDatabase.getUserMeals()`, `LocalDatabase.deleteMeal()` |
| **User interaction** | Select meal type (breakfast/lunch/dinner/snack), browse/search Nigerian food database, add foods to cart with adjustable servings/quantities, add all to meal, save meal |
| **Persistence** | Meals table (one row per meal) + MealFoods table (one row per food within a meal) |
| **Relationships** | Belongs to User. Each meal contains 1+ foods. Foods reference the NigerianFood catalog by ID. |
| **Components** | `meal-logger.tsx`, `daily-meal-tracker.tsx`, `weekly-meal-overview.tsx` |

### 2.4 Nigerian Food Database

| Attribute | Detail |
|---|---|
| **Purpose** | Reference catalog of ~100 Nigerian foods with per-100g nutrition data |
| **Current implementation** | Static array in `app/data/nigerian-foods.ts` (1,461 lines) |
| **User interaction** | Search by name/description, filter by category (8 categories), view nutrition per serving |
| **Persistence** | NigerianFoods table (reference data, seeded once, rarely changes) |
| **Relationships** | Referenced by MealFood entries, used by nutrition calculations, used by AI predictions for nutrition enrichment |

### 2.5 Nutrition Summary & Analytics

| Attribute | Detail |
|---|---|
| **Purpose** | Aggregate nutrition data over time periods (7/14/30 days), macronutrient distribution, daily breakdowns |
| **Current implementation** | Client-side computation from `useMeals()` data in `nutrition-summary.tsx` |
| **User interaction** | Select time period, view charts and daily breakdowns |
| **Persistence** | Computed from Meals — no separate storage needed |
| **Relationships** | Depends on Meals |

### 2.6 User Statistics (Streaks & Achievements)

| Attribute | Detail |
|---|---|
| **Purpose** | Track meal logging streaks, total meals logged, average calories, favorite food, achievements |
| **Current implementation** | `LocalDatabase.updateUserStatsAfterMeal()` — computed inline on every meal create/delete |
| **User interaction** | View stats on personalized welcome card |
| **Persistence** | UserStats table (1:1 with User) or computed on-the-fly |
| **Relationships** | Belongs to User. Data derived from Meals. |

### 2.7 Water Tracking

| Attribute | Detail |
|---|---|
| **Purpose** | Track daily water intake in milliliters |
| **Current implementation** | `LocalDatabase.logWaterIntake()`, `LocalDatabase.getWaterIntake()` |
| **User interaction** | Quick-add buttons (250ml, 500ml, 750ml, 1000ml), custom amount, remove water, progress bar against 2000ml goal |
| **Persistence** | WaterIntakes table (one row per user per date, upsert pattern) |
| **Relationships** | Belongs to User |

### 2.8 Sleep Tracking

| Attribute | Detail |
|---|---|
| **Purpose** | Track nightly sleep duration and quality |
| **Current implementation** | Direct localStorage reads/writes in `sleep-tracker.tsx` (BYPASSES LocalDatabase — bug) |
| **User interaction** | Navigate dates, select hours slept (3-15h, 0.5h increments), select quality (poor/fair/good/excellent), set bed/wake times, notes |
| **Persistence** | SleepEntries table (one row per user per date) |
| **Relationships** | Belongs to User |

### 2.9 Physical Activities

| Attribute | Detail |
|---|---|
| **Purpose** | Display activity types with calorie burn rates (NO logging implemented) |
| **Current implementation** | Static display in `physical-activities.tsx` — `ActivityEntry` interface exists but is never persisted |
| **User interaction** | View activity types and images |
| **Persistence** | ActivityTypes table (reference data only — no user-specific logging exists) |
| **Relationships** | Reference data only — no user relationship currently |

### 2.10 BMI & Health Metrics

| Attribute | Detail |
|---|---|
| **Purpose** | Calculate BMI, waist-to-height ratio, waist-to-hip ratio, overall health risk, daily calorie recommendation |
| **Current implementation** | Pure functions in `app/utils/calculations.ts` — computed from User data |
| **User interaction** | Edit height/weight/waist/hip measurements, view real-time calculations |
| **Persistence** | Computed from User data — optionally store BMI history as time series |
| **Relationships** | Depends on User. Optional BMIHistory table for tracking changes over time. |

### 2.11 Recommendations & Meal Plans

| Attribute | Detail |
|---|---|
| **Purpose** | Display personalized food recommendations and sample meal plans based on BMI category |
| **Current implementation** | Static content in `recommendations.tsx` — not personalized beyond BMI category |
| **User interaction** | View recommendations (read-only) |
| **Persistence** | Recommendations table (static reference data, keyed by BMI category + cultural background) |
| **Relationships** | Reference data. Could eventually be personalized based on user health goals and preferences. |

### 2.12 AI Food Classification

| Attribute | Detail |
|---|---|
| **Purpose** | Upload a food photo, receive classification of Nigerian starchy foods |
| **Current implementation** | Fully working — `ai-food-scanner.tsx` → `POST /api/ai/predict` → FastAPI model service |
| **User interaction** | Upload/drag-drop image, click Scan, view predictions with confidence scores |
| **Persistence** | Optionally store prediction history (FoodPredictions table) |
| **Relationships** | Belongs to User. Predictions could link to NigerianFood entries for nutrition data. |

### 2.13 Admin Dashboard

| Attribute | Detail |
|---|---|
| **Purpose** | Import user data, view all users, view app statistics |
| **Current implementation** | `LocalDatabase.getUsers()`, `LocalDatabase.getAppStats()`, `LocalDatabase.importUserDataForAdmin()` |
| **User interaction** | Import JSON, view imported data, browse users, export user data |
| **Persistence** | Reads from all tables. Imports write to relevant tables. |
| **Relationships** | Admin role required. Operates across all users. |

### 2.14 Data Export/Import

| Attribute | Detail |
|---|---|
| **Purpose** | Users export their own data (JSON); users and admins import data |
| **Current implementation** | `LocalDatabase.exportUserData()`, `LocalDatabase.importUserData()` |
| **User interaction** | Select month/year, download JSON; upload JSON to restore |
| **Persistence** | Generates JSON from all user entities. Import creates/updates records. |
| **Relationships** | Cross-entity operation. |

### 2.15 Tutorial & Rating

| Attribute | Detail |
|---|---|
| **Purpose** | First-time user onboarding tutorial; prompt to rate the app |
| **Current implementation** | `tutorial_completed_{userId}` and `app_rated_{userId}` in localStorage |
| **User interaction** | Navigate tutorial steps, skip/complete; rate via Google Forms |
| **Persistence** | Boolean flags on User or UserSettings — migrate to database columns |

---

## 3. Database Schema

### 3.1 Entity-Relationship Diagram (ASCII)

```
┌──────────┐       ┌───────────────┐       ┌──────────────┐
│   User   │1────1│  UserProfile  │       │  UserStats   │
│          │       │               │       │              │
└────┬─────┘       └───────────────┘       └──────┬───────┘
     │                                            │
     │1                                          *│
     │                                            │
     │        ┌──────────┐       ┌──────────────┐ │
     ├───────*│   Meal   │1─────*│  MealFood    │ │
     │        │          │       │              │ │
     │        └──────────┘       └──────┬───────┘ │
     │                                  │         │
     │                                  │*        │
     │                           ┌──────▼───────┐ │
     │                           │ NigerianFood │ │
     │                           │  (catalog)   │ │
     │                           └──────────────┘ │
     │                                            │
     ├───────*│ WaterIntake │                     │
     ├───────*│ SleepEntry  │                     │
     ├───────*│ FoodPrediction │                  │
     ├───────*│ BMIHistory  │                     │
     │                                            │
     └────────────────────────────────────────────┘
```

### 3.2 Table Definitions

#### `User`

The central entity. All other entities reference this table.

```prisma
model User {
  id                 String    @id @default(uuid())
  email              String    @unique
  fullName           String
  age                Int
  gender             Gender
  height             Float                         // cm
  weight             Float                         // kg
  waistCircumference Float?                        // cm
  hipCircumference   Float?                        // cm
  location           String?
  occupation         String?
  healthConditions   String[]                      // PostgreSQL array
  fitnessGoals       String[]                      // PostgreSQL array
  role               Role      @default(USER)
  passwordHash       String
  tutorialCompleted  Boolean   @default(false)
  appRated           Boolean   @default(false)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  lastLoginAt        DateTime  @default(now())

  profile         UserProfile?
  stats           UserStats?
  meals           Meal[]
  waterIntakes    WaterIntake[]
  sleepEntries    SleepEntry[]
  predictions     FoodPrediction[]
  bmiHistory      BMIHistory[]

  @@index([email])
  @@index([role])
}

enum Gender {
  male
  female
  other
}

enum Role {
  USER
  ADMIN
}
```

**Design decisions:**
- `id` is UUID (not auto-increment) — matches existing localStorage `uuidv4()` generation, avoids enumeration attacks
- `tutorialCompleted` and `appRated` moved from per-user localStorage keys into User columns — simpler, queryable
- `healthConditions` and `fitnessGoals` are PostgreSQL string arrays — flexible, no need for separate join tables at this scale
- `passwordHash` stores bcrypt output — NEVER plaintext
- `lastLoginAt` updated on every login for active-user tracking

#### `UserProfile`

1:1 with User. Stores preferences, settings, and personalization data.

```prisma
model UserProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Preferences
  culturalBackground String[]
  dietaryRestrictions String[]
  activityLevel     ActivityLevel @default(MODERATE)
  healthGoals       String[]
  favoriteFoods     String[]      // favoriteNigerianFoods — renamed for brevity

  // Meal Preferences
  breakfastFoods String[]          // JSON array of food IDs/names
  lunchFoods     String[]
  dinnerFoods    String[]
  snackFoods     String[]

  // Settings
  notifications   Boolean  @default(true)
  dataSharing     Boolean  @default(false)
  units           Units    @default(METRIC)
  breakfastReminderTime String? @default("07:00")  // HH:MM
  lunchReminderTime     String? @default("12:00")
  dinnerReminderTime    String? @default("19:00")
  weeklyCalorieTarget   Float?  @default(2000)
  weeklyProteinTarget   Float?  @default(100)
  weeklyExerciseDays    Int?    @default(3)

  // Recommendations
  suggestedFoods         String[]
  avoidFoods             String[]
  mealPlanPreference     String?  @default("balanced_nigerian")
  supplementSuggestions  String[]

  updatedAt DateTime @updatedAt

  @@index([userId])
}

enum ActivityLevel {
  SEDENTARY
  LIGHT
  MODERATE
  ACTIVE
}

enum Units {
  METRIC
  IMPERIAL
}
```

**Design decisions:**
- 1:1 with User via `@unique` on `userId` — simpler than embedding 50+ fields in User
- Array fields use PostgreSQL native arrays — no separate tables for simple lists
- `reminderTimes` denormalized into separate columns — cleaner than a JSON blob
- `weeklyGoals` denormalized — three simple columns vs. nested object

#### `Meal`

One row per meal logged. Contains meal-level metadata and total nutrition summary.

```prisma
model Meal {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      MealType
  date      DateTime @db.Date       // calendar date (no time component)
  time      String                   // HH:MM format
  mood      Mood?
  notes     String?
  createdAt DateTime @default(now())

  foods          MealFood[]
  totalNutrition NutritionTotal?

  @@index([userId, date])
  @@index([userId, createdAt])
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

enum Mood {
  GREAT
  GOOD
  OKAY
  POOR
}
```

#### `MealFood`

One row per food item within a meal. A meal with 3 foods produces 3 MealFood rows.

```prisma
model MealFood {
  id     String @id @default(uuid())
  mealId String
  meal   Meal   @relation(fields: [mealId], references: [id], onDelete: Cascade)

  foodId    String?
  food      NigerianFood? @relation(fields: [foodId], references: [id])
  name      String          // denormalized — allows custom foods not in catalog
  grams     Float           // portion weight in grams

  // Per-portion nutrition (scaled to grams)
  calories Float
  protein  Float
  carbs    Float
  fats     Float
  fiber    Float
  iron     Float
  vitaminA Float

  @@index([mealId])
  @@index([foodId])
}
```

**Design decisions:**
- `foodId` is nullable — allows custom/manual food entries not in the catalog
- `name` is denormalized — avoids a join for simple displays and handles custom foods
- Nutrition values stored directly — avoids recomputation, captures the exact values at time of logging (important if food catalog values change later)
- No `totalNutrition` on MealFood — that's the meal-level aggregate

#### `NutritionTotal`

Meal-level nutrition aggregate. 1:1 with Meal. Computed on creation.

```prisma
model NutritionTotal {
  id       String @id @default(uuid())
  mealId   String @unique
  meal     Meal   @relation(fields: [mealId], references: [id], onDelete: Cascade)

  calories Float
  protein  Float
  carbs    Float
  fats     Float
  fiber    Float
  iron     Float
  vitaminA Float
}
```

**Design decisions:**
- Separate table rather than embedding in Meal — cleaner separation, Meal table stays focused on metadata
- Computed once on meal creation — never updated (meals are immutable after logging per current UX)

#### `NigerianFood`

Reference catalog. Seeded once, rarely updated.

```prisma
model NigerianFood {
  id          String @id
  name        String
  category    String
  description String
  servingSize String         // e.g., "1 ladle (100g cooked)"
  servingWeight Float        // grams per serving

  // Per-100g nutrition (reference values)
  caloriesPer100g Float
  proteinPer100g  Float
  carbsPer100g    Float
  fatsPer100g     Float
  fiberPer100g    Float
  ironPer100g     Float
  vitaminAPer100g Float

  // Portion-based calorie estimates
  portionCalSmall  Float
  portionCalMedium Float
  portionCalLarge  Float

  mealFoods MealFood[]

  @@index([category])
  @@index([name])
}
```

**Design decisions:**
- `id` is manually assigned (e.g., `"amala-yam-flour"`) — matches existing slug-based IDs
- Per-100g values used by `calculatePortionNutrition()` to scale to any portion size
- Portion calorie estimates for small/medium/large — used by the cart UI in meal-logger

#### `UserStats`

1:1 with User. Tracks aggregated statistics. Updated whenever a meal is created or deleted.

```prisma
model UserStats {
  id                  String   @id @default(uuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  totalMealsLogged    Int      @default(0)
  averageDailyCalories Float   @default(0)
  favoriteFood        String?  @default("Not determined yet")
  longestStreak       Int      @default(0)
  currentStreak       Int      @default(0)
  achievements        String[]
  lastUpdated         DateTime @updatedAt
}
```

**Design decisions:**
- Computed from Meals table on create/delete — not a source of truth
- Could be replaced with on-the-fly computation if query performance is sufficient
- `weightProgress` moved to separate `BMIHistory` table — Stats stays focused on meal-derived metrics

#### `WaterIntake`

One row per user per date. Upsert pattern (update amount if record exists, create if not).

```prisma
model WaterIntake {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime @db.Date
  amount    Float                            // milliliters
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, date])
  @@index([userId, date])
}
```

**Design decisions:**
- `@@unique([userId, date])` enforces one record per user per day
- Amount is cumulative — frontend adds new intake to existing amount

#### `SleepEntry`

One row per sleep log entry. User can have multiple entries across dates.

```prisma
model SleepEntry {
  id           String       @id @default(uuid())
  userId       String
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  date         DateTime     @db.Date
  hoursSlept   Float
  sleepQuality SleepQuality
  bedTime      String?           // HH:MM
  wakeTime     String?           // HH:MM
  notes        String?
  createdAt    DateTime     @default(now())

  @@unique([userId, date])
  @@index([userId, date])
}

enum SleepQuality {
  POOR
  FAIR
  GOOD
  EXCELLENT
}
```

#### `FoodPrediction`

Optional — stores AI food classification history. Users can review past predictions.

```prisma
model FoodPrediction {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topClassName  String
  topConfidence Float
  allPredictions Json        // stored as JSONB: [{class_name, confidence}]
  inferenceTimeMs Float
  createdAt     DateTime @default(now())

  @@index([userId, createdAt])
}
```

**Design decisions:**
- `allPredictions` stored as JSONB — avoids a separate PredictionDetail table for a secondary feature
- Only persisted if the feature is requested — Phase 5+

#### `BMIHistory`

Optional — tracks weight and BMI changes over time. Replaces `weightProgress` array in UserStats.

```prisma
model BMIHistory {
  id     String   @id @default(uuid())
  userId String
  user   User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date   DateTime @db.Date
  weight Float    // kg at this point in time
  bmi    Float?   // computed from weight and user.height at time of recording

  @@unique([userId, date])
  @@index([userId, date])
}
```

---

## 4. Entity Relationship Explanation

### Ownership Chain

```
User (root)
 ├── UserProfile (1:1, cascades)
 ├── UserStats (1:1, cascades)
 ├── Meal (1:many, cascades)
 │    ├── MealFood (1:many, cascades)
 │    │    └── NigerianFood (nullable reference, SET NULL on delete)
 │    └── NutritionTotal (1:1, cascades)
 ├── WaterIntake (1:many, cascades)
 ├── SleepEntry (1:many, cascades)
 ├── FoodPrediction (1:many, cascades)
 └── BMIHistory (1:many, cascades)
```

### Key Design Principles

1. **Cascade deletes.** Deleting a User removes all associated data. No orphaned records.
2. **UUID primary keys.** Consistent with existing data model, safe for API exposure, no enumeration risk.
3. **Denormalized nutrition on MealFood.** Nutrition values are captured at log time. If the NigerianFood catalog is updated later, historical meal data remains accurate.
4. **Upsert patterns.** WaterIntake and SleepEntry use `@@unique([userId, date])` — one log per user per day. Updates use upsert.
5. **JSONB for flexible data.** `FoodPrediction.allPredictions` uses JSONB — simple, queryable if needed, avoids explosion of prediction detail rows.
6. **Arrays for simple lists.** `healthConditions`, `fitnessGoals`, `culturalBackground`, `achievements` are PostgreSQL string arrays — avoids join tables for simple value lists that don't need independent identity.
7. **Nullable foodId.** MealFood.foodId is nullable — custom food entries (user types a food name and calories manually) don't reference the catalog.

---

## 5. API Specification

All endpoints return `{ success: boolean, data?: T, error?: string, code?: string }`.

All protected endpoints require `Authorization: Bearer <token>` header.

### 5.1 Authentication

#### `POST /api/auth/signup`

```
Auth: None
Body: {
  fullName: string,
  email: string,
  password: string,
  age: number,
  gender: "male" | "female" | "other",
  height: number,        // cm
  weight: number,        // kg
  waistCircumference?: number,
  hipCircumference?: number
}
Success 201: { success: true, data: { user: User, token: string } }
Errors:
  400 VALIDATION_ERROR — missing/invalid fields
  409 CONFLICT — email already registered
```

**Implementation notes:**
- Hash password with bcrypt (12 rounds)
- Create User + UserProfile (defaults) + UserStats (initial) in a transaction
- Generate JWT with 7-day expiry
- Set `lastLoginAt` to now

#### `POST /api/auth/login`

```
Auth: None
Body: { email: string, password: string }
Success 200: { success: true, data: { user: User, token: string } }
Errors:
  400 VALIDATION_ERROR
  401 INVALID_CREDENTIALS — email not found or password mismatch
```

**Implementation notes:**
- Compare password with bcrypt
- Update `lastLoginAt`
- Return JWT

#### `GET /api/auth/me`

```
Auth: Bearer token
Success 200: { success: true, data: { user: User } }
Errors:
  401 UNAUTHORIZED — missing/invalid/expired token
```

#### `POST /api/auth/logout`

```
Auth: Bearer token
Success 200: { success: true, data: null }
```

**Implementation notes:**
- JWT is stateless — client simply discards the token
- This endpoint exists for API completeness. Could add token blacklisting later.

### 5.2 Users & Profile

#### `PATCH /api/users/me`

Update current user's core fields.

```
Auth: Bearer token
Body: Partial<{
  fullName, age, gender, height, weight,
  waistCircumference, hipCircumference,
  location, occupation,
  healthConditions, fitnessGoals
}>
Success 200: { success: true, data: { user: User } }
Errors: 400, 401
```

#### `GET /api/profile`

```
Auth: Bearer token
Success 200: { success: true, data: { profile: UserProfile } }
Errors: 401
```

**Note:** Profile is created at signup with defaults — always exists for authenticated users.

#### `PATCH /api/profile`

```
Auth: Bearer token
Body: Partial<{
  culturalBackground, dietaryRestrictions,
  activityLevel, healthGoals, favoriteFoods,
  breakfastFoods, lunchFoods, dinnerFoods, snackFoods,
  notifications, dataSharing, units,
  breakfastReminderTime, lunchReminderTime, dinnerReminderTime,
  weeklyCalorieTarget, weeklyProteinTarget, weeklyExerciseDays,
  suggestedFoods, avoidFoods,
  mealPlanPreference, supplementSuggestions
}>
Success 200: { success: true, data: { profile: UserProfile } }
Errors: 400, 401
```

#### `PUT /api/profile/password`

```
Auth: Bearer token
Body: { currentPassword: string, newPassword: string }
Success 200: { success: true, data: null }
Errors:
  400 VALIDATION_ERROR
  401 INVALID_CREDENTIALS — current password wrong
```

### 5.3 Meals

#### `GET /api/meals`

```
Auth: Bearer token
Query:
  ?date=YYYY-MM-DD          — get meals for a specific date
  ?startDate=YYYY-MM-DD     — get meals from this date (inclusive)
  &endDate=YYYY-MM-DD       — get meals up to this date (inclusive)
  &type=breakfast|lunch|dinner|snack — filter by meal type
Success 200: { success: true, data: { meals: Meal[] } }
Errors: 400, 401
```

**Implementation notes:**
- Returns meals for the authenticated user only
- Sorted by `date DESC, createdAt DESC`
- Each meal includes its `foods[]` and `totalNutrition`

#### `GET /api/meals/[id]`

```
Auth: Bearer token
Success 200: { success: true, data: { meal: Meal } }
Errors: 401, 404 NOT_FOUND
```

#### `POST /api/meals`

```
Auth: Bearer token
Body: {
  type: "breakfast" | "lunch" | "dinner" | "snack",
  date: string,          // YYYY-MM-DD
  time: string,          // HH:MM
  foods: [{
    foodId?: string,     // optional — reference to NigerianFood catalog
    name: string,        // required
    grams: number,
    nutrition: {
      calories, protein, carbs, fats,
      fiber, iron, vitaminA
    }
  }],
  mood?: "great" | "good" | "okay" | "poor",
  notes?: string
}
Success 201: { success: true, data: { meal: Meal } }
Errors: 400, 401
```

**Implementation notes:**
- Create Meal + MealFood[] + NutritionTotal in a transaction
- Auto-update UserStats after creation:
  - Increment `totalMealsLogged`
  - Recalculate `averageDailyCalories`
  - Update `favoriteFood` (most frequently logged)
  - Recalculate streaks
  - Check for achievement unlocks

#### `DELETE /api/meals/[id]`

```
Auth: Bearer token
Success 200: { success: true, data: null }
Errors: 401, 404 NOT_FOUND
```

**Implementation notes:**
- Verify the meal belongs to the authenticated user
- Cascade deletes MealFood[] and NutritionTotal
- Recalculate UserStats after deletion

### 5.4 Water

#### `GET /api/water`

```
Auth: Bearer token
Query: ?startDate=&endDate=
Success 200: { success: true, data: { intakes: WaterIntake[] } }
Errors: 400, 401
```

#### `GET /api/water/today`

```
Auth: Bearer token
Success 200: { success: true, data: { intake: WaterIntake | null } }
Errors: 401
```

#### `POST /api/water`

Upsert pattern — creates if no record for today, updates if exists.

```
Auth: Bearer token
Body: { date: string, amount: number }   // amount in milliliters
Success 200: { success: true, data: { intake: WaterIntake } }
Errors: 400, 401
```

**Implementation notes:**
- Uses `upsert` on `@@unique([userId, date])`
- Amount replaces existing value (frontend handles cumulative addition)

### 5.5 Sleep

#### `GET /api/sleep`

```
Auth: Bearer token
Query: ?startDate=&endDate=
Success 200: { success: true, data: { entries: SleepEntry[] } }
Errors: 400, 401
```

#### `POST /api/sleep`

Upsert pattern on userId + date.

```
Auth: Bearer token
Body: {
  date: string,
  hoursSlept: number,
  sleepQuality: "poor" | "fair" | "good" | "excellent",
  bedTime?: string,      // HH:MM
  wakeTime?: string,     // HH:MM
  notes?: string
}
Success 200: { success: true, data: { entry: SleepEntry } }
Errors: 400, 401
```

### 5.6 Stats

#### `GET /api/stats`

```
Auth: Bearer token
Success 200: { success: true, data: { stats: UserStats } }
Errors: 401
```

#### `GET /api/stats/weight`

Returns weight history for charts.

```
Auth: Bearer token
Query: ?startDate=&endDate=
Success 200: { success: true, data: { history: BMIHistory[] } }
Errors: 400, 401
```

**Implementation notes:**
- New entry created whenever user updates weight via `PATCH /api/users/me`
- BMI is computed server-side at record creation time

#### `GET /api/stats/streaks`

```
Auth: Bearer token
Success 200: {
  success: true,
  data: {
    currentStreak: number,
    longestStreak: number
  }
}
Errors: 401
```

#### `GET /api/stats/achievements`

```
Auth: Bearer token
Success 200: { success: true, data: { achievements: string[] } }
Errors: 401
```

### 5.7 Nutrition & Food Database

#### `GET /api/foods`

```
Auth: Optional (public reference data)
Query:
  ?search=string          — search by name or description
  &category=string        — filter by category
  &page=1&limit=20        — pagination
Success 200: {
  success: true,
  data: {
    foods: NigerianFood[],
    total: number,
    page: number,
    totalPages: number
  }
}
```

#### `GET /api/foods/[id]`

```
Auth: Optional
Success 200: { success: true, data: { food: NigerianFood } }
Errors: 404
```

#### `GET /api/foods/categories`

```
Auth: Optional
Success 200: { success: true, data: { categories: string[] } }
```

#### `POST /api/foods` (Admin only)

```
Auth: Bearer token (admin role)
Body: { name, category, description, servingSize, servingWeight, caloriesPer100g, ... }
Success 201: { success: true, data: { food: NigerianFood } }
Errors: 400, 401, 403
```

### 5.8 Dashboard Quick Stats

#### `GET /api/dashboard/summary`

Aggregated data for the dashboard Overview tab — reduces multiple API calls.

```
Auth: Bearer token
Success 200: {
  success: true,
  data: {
    todayCalories: number,
    todayMeals: Meal[],
    waterIntake: WaterIntake | null,
    bmi: { bmi, category, ... },
    dailyCalorieTarget: number,
    currentStreak: number,
    achievements: string[]
  }
}
Errors: 401
```

**Implementation notes:**
- Server-side computation of all overview tab data in one request
- Uses `date-fns` for date calculations (already installed)
- BMI is cached — computed from User data

### 5.9 Nuition Dashboard

#### `GET /api/dashboard/nutrition`

```
Auth: Bearer token
Query: ?period=7|14|30
Success 200: {
  success: true,
  data: {
    avgDailyCalories: number,
    avgDailyProtein: number,
    avgDailyFiber: number,
    avgDailyIron: number,
    macroDistribution: { carbsPct, proteinPct, fatsPct },
    dailyBreakdown: [{ date, mealCount, calories, protein, carbs, fats }]
  }
}
Errors: 400, 401
```

### 5.10 Export & Import

#### `GET /api/export`

```
Auth: Bearer token
Query: ?month=MM&year=YYYY
Success 200: JSON download (Content-Disposition: attachment)
  {
    user: User,
    meals: Meal[],
    profile: UserProfile,
    stats: UserStats,
    exportDate: string
  }
Errors: 400, 401
```

#### `POST /api/import`

```
Auth: Bearer token
Body: { jsonData: string }    // the JSON from export
Success 200: { success: true, data: { importedMeals: number } }
Errors: 400, 401
```

### 5.11 Admin

All admin endpoints require `role = ADMIN`.

#### `GET /api/admin/stats`

```
Auth: Bearer token (admin)
Success 200: {
  success: true,
  data: {
    totalUsers: number,
    totalMeals: number,
    activeUsers: number,    // logged in within last 7 days
    totalImported: number
  }
}
Errors: 401, 403
```

#### `GET /api/admin/users`

```
Auth: Bearer token (admin)
Query: ?page=1&limit=20
Success 200: {
  success: true,
  data: {
    users: User[],
    total: number,
    page: number,
    totalPages: number
  }
}
Errors: 401, 403
```

#### `GET /api/admin/users/[id]`

```
Auth: Bearer token (admin)
Success 200: {
  success: true,
  data: {
    user: User,
    profile: UserProfile | null,
    stats: UserStats | null,
    recentMeals: Meal[]
  }
}
Errors: 401, 403, 404
```

#### `POST /api/admin/import`

```
Auth: Bearer token (admin)
Body: { jsonData: string }    // JSON from export
Success 200: { success: true, data: { importedData: ImportedUserData } }
Errors: 400, 401, 403
```

#### `GET /api/admin/imports`

```
Auth: Bearer token (admin)
Success 200: { success: true, data: { imports: ImportedUserData[] } }
Errors: 401, 403
```

#### `DELETE /api/admin/imports/[id]`

```
Auth: Bearer token (admin)
Success 200: { success: true, data: null }
Errors: 401, 403, 404
```

### 5.12 AI (Already implemented in Phase 4)

These endpoints exist and should NOT be modified in this phase.

#### `GET /api/ai/health`

#### `POST /api/ai/predict`

### 5.13 Health

#### `GET /api/health`

```
Auth: None
Success 200: {
  success: true,
  data: {
    status: "ok",
    name: "GluGuide API",
    version: "0.1.0",
    timestamp: string,
    db: "connected"     // [NEW] add DB connectivity check
  }
}
```

---

## 6. Frontend → Backend Mapping

For every component, the API endpoints it will consume after migration.

| Component | Reads From | Writes To |
|---|---|---|
| `auth-context.tsx` | `POST /api/auth/login`, `GET /api/auth/me` | `POST /api/auth/signup`, `POST /api/auth/logout` |
| `auth-page.tsx` | (via auth context) | (via auth context) |
| `dashboard.tsx` | `GET /api/dashboard/summary`, `GET /api/water/today`, `GET /api/meals?date=today` | `DELETE /api/meals/[id]` |
| `meal-logger.tsx` | `GET /api/foods?search=&category=`, `GET /api/foods/categories` | `POST /api/meals` |
| `daily-meal-tracker.tsx` | `GET /api/meals?date=X` | (via embedded MealLogger) |
| `weekly-meal-overview.tsx` | `GET /api/meals?startDate=&endDate=` | — |
| `nutrition-summary.tsx` | `GET /api/dashboard/nutrition?period=` | — |
| `sleep-tracker.tsx` | `GET /api/sleep?startDate=&endDate=` | `POST /api/sleep` |
| `water-tracker.tsx` | `GET /api/water/today` | `POST /api/water` |
| `bmi-calculator.tsx` | (reads user from auth context) | `PATCH /api/users/me` |
| `profile-settings.tsx` | `GET /api/profile` | `PATCH /api/profile`, `PATCH /api/users/me`, `PUT /api/profile/password` |
| `user-profile-details.tsx` | `GET /api/profile`, `GET /api/meals?startDate=&endDate=` | — |
| `personalized-welcome.tsx` | `GET /api/stats`, `GET /api/profile` | — |
| `recommendations.tsx` | (reads user from auth context — BMI) | — |
| `physical-activities.tsx` | — (static content) | — |
| `ai-food-scanner.tsx` | `POST /api/ai/predict` | — |
| `admin-dashboard.tsx` | `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/admin/imports`, `GET /api/admin/users/[id]` | `POST /api/admin/import`, `DELETE /api/admin/imports/[id]` |
| `portion-sizing-guide.tsx` | — (static content) | — |
| `tutorial.tsx` | — (UI-only) | (sets `tutorialCompleted` via user update) |
| `rating-dialog.tsx` | — (UI-only) | (sets `appRated` via user update) |

**Optimistic updates:** Meal logging is a good candidate — show the meal in the list immediately and roll back if the server rejects it. Water tracking is also suitable. Sleep entries are less latency-sensitive.

**Read-only components:** `recommendations.tsx`, `nutrition-summary.tsx`, `personalized-welcome.tsx`, `user-profile-details.tsx`, `physical-activities.tsx`, `weekly-meal-overview.tsx`, `portion-sizing-guide.tsx`. These don't modify data.

---

## 7. Validation Rules

### 7.1 Authentication

| Field | Rule |
|---|---|
| `email` | Required, valid email format, max 255 chars |
| `password` | Required, min 8 chars |
| `fullName` | Required, min 2 chars, max 100 chars |
| `age` | Required, integer, 1–120 |
| `gender` | Required, one of `male`, `female`, `other` |
| `height` | Required, float, 50–300 cm |
| `weight` | Required, float, 20–500 kg |
| `waistCircumference` | Optional, float, 30–300 cm |
| `hipCircumference` | Optional, float, 30–300 cm |

### 7.2 Profile

| Field | Rule |
|---|---|
| `activityLevel` | Optional, one of `SEDENTARY`, `LIGHT`, `MODERATE`, `ACTIVE` |
| `units` | Optional, one of `METRIC`, `IMPERIAL` |
| `weeklyCalorieTarget` | Optional, float, 500–10000 |
| `weeklyProteinTarget` | Optional, float, 10–500 |
| `weeklyExerciseDays` | Optional, integer, 0–7 |
| `reminderTimes` | Optional, string matching `HH:MM` format |

### 7.3 Meals

| Field | Rule |
|---|---|
| `type` | Required, one of `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK` |
| `date` | Required, valid date string `YYYY-MM-DD`, not in the future |
| `time` | Required, valid time string `HH:MM` |
| `foods` | Required, array with at least 1 item, max 50 items |
| `foods[].name` | Required, min 1 char, max 200 chars |
| `foods[].grams` | Required, float, 1–10000 |
| `foods[].nutrition.calories` | Required, float, 0–10000 |
| `foods[].nutrition.protein` | Required, float, 0–500 |
| `mood` | Optional, one of `GREAT`, `GOOD`, `OKAY`, `POOR` |
| `notes` | Optional, max 500 chars |

### 7.4 Water

| Field | Rule |
|---|---|
| `date` | Required, valid date, not in the future |
| `amount` | Required, float, 0–50000 ml |

### 7.5 Sleep

| Field | Rule |
|---|---|
| `date` | Required, valid date, not in the future |
| `hoursSlept` | Required, float, 0–24 |
| `sleepQuality` | Required, one of `POOR`, `FAIR`, `GOOD`, `EXCELLENT` |
| `bedTime` | Optional, `HH:MM` format |
| `wakeTime` | Optional, `HH:MM` format |

### 7.6 Business Rules

1. **Users can only access their own data.** Every meal, water intake, sleep entry, and profile query is scoped to `userId` from the JWT.
2. **One water intake record per user per date.** Use upsert.
3. **One sleep entry per user per date.** Use upsert. Overwrites existing entry.
4. **Stats update on meal create/delete.** Use a database transaction or a service function that updates `UserStats` atomically with meal operations.
5. **Streak calculation.** A streak is a consecutive sequence of dates (not necessarily today) where at least one meal was logged. Gaps break the streak.
6. **Achievement unlocks:**
   - "First Meal Logged" — totalMealsLogged = 1
   - "Consistent Logger" — totalMealsLogged = 10
   - "Week Warrior" — currentStreak ≥ 7
   - "Monthly Master" — longestStreak ≥ 30
   - "Welcome to NaijaFit!" — given on signup
7. **Admin role required for admin endpoints.** Check `user.role === "ADMIN"` in the Route Handler.
8. **BMI history tracked on weight change.** When user updates weight via `PATCH /api/users/me`, if weight changed, create a new `BMIHistory` record.
9. **Nutrition enrichment of AI predictions.** When a food classification is returned, the frontend may optionally request nutrition data by matching the predicted class name against the NigerianFood catalog. This is currently a frontend concern but could become a backend feature.

---

## 8. Authentication Design

### 8.1 Strategy

**JWT (JSON Web Tokens) with bcrypt password hashing.**

| Decision | Rationale |
|---|---|
| **JWT over sessions** | Stateless — no server-side session store. Simple to implement. Trivial to test with curl/Postman. |
| **Bearer tokens** | Standard. Sent in `Authorization` header. Works with fetch(), React Query, and curl. |
| **7-day expiry** | Balances security and user convenience. No refresh token for v1. |
| **bcrypt (12 rounds)** | Industry standard. Already planned. `bcryptjs` for zero native dependencies (works everywhere). |
| **No httpOnly cookies (for now)** | Simpler for a mobile-first SPA. JWT stored in React state (memory). Upgrade path: httpOnly cookies for CSRF protection. |
| **Route Handler-level auth** | Each protected handler verifies the token at the top of the function. No middleware chain. See Section 8.2. |

### 8.2 Implementation Pattern

```typescript
// lib/auth/jwt.ts
import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, SECRET)
  return { userId: payload.sub! }
}
```

```typescript
// lib/auth/password.ts
import bcrypt from "bcryptjs"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

```typescript
// lib/auth/get-user.ts
import { verifyToken } from "./jwt"
import { prisma } from "@/lib/db/prisma"

export async function getUserFromRequest(req: Request) {
  const header = req.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null

  try {
    const { userId } = await verifyToken(header.slice(7))
    return prisma.user.findUnique({ where: { id: userId } })
  } catch {
    return null
  }
}
```

```typescript
// Example protected Route Handler usage:
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")
  // ... business logic
}
```

### 8.3 Authorization (Admin)

Admin endpoints additionally check `user.role === "ADMIN"`:

```typescript
if (user.role !== "ADMIN") {
  return errorResponse("Insufficient permissions", 403, "FORBIDDEN")
}
```

---

## 9. ORM Recommendation

### Comparison

| Criterion | Prisma | Drizzle |
|---|---|---|
| **Type safety** | Generated client with full types | Schema → TypeScript types, SQL-like builder |
| **Schema definition** | Prisma Schema Language (declarative) | TypeScript objects (programmatic) |
| **Migrations** | Built-in `prisma migrate dev` | Built-in `drizzle-kit` |
| **Learning curve** | Low — Prisma Schema Language is intuitive | Medium — SQL-like API requires SQL knowledge |
| **Query syntax** | `prisma.user.findMany({ where: {...} })` | `db.select().from(users).where(eq(...))` |
| **Relations** | Automatic includes with `.include()` | Manual joins or relation queries |
| **Tooling** | Prisma Studio (visual DB browser) | Drizzle Studio |
| **Ecosystem** | Larger, more tutorials, more examples | Growing, good docs |
| **Raw SQL** | `prisma.$queryRaw` | Native — you're always close to SQL |
| **Bundle size** | Larger (generated client) | Smaller |
| **Edge runtime** | Requires `@prisma/client/edge` | Native support |

### Recommendation: Prisma

**Three reasons specific to this project:**

1. **The schema matches Prisma's strengths.** This project has 11+ models with 1:1, 1:many, and optional relations. Prisma's declarative schema language and automatic join handling (`include`, `select`) make these queries clean and type-safe. Drizzle would require manual join construction for the same queries.

2. **Type sharing across the monorepo.** Prisma generates TypeScript types from the schema. Route Handlers, services, and even frontend API clients can import these types directly from `@prisma/client`. No duplication.

3. **Team and university context.** Prisma Studio provides a visual database browser that's invaluable during development and debugging. The declarative schema file serves as documentation. For a university project with potential handoff, this clarity matters more than Drizzle's raw-SQL flexibility.

**Migration path:** If the project outgrows Prisma (rare), the schema can be exported as SQL and imported into any ORM. The API contract (Route Handler signatures) would not change.

---

## 10. Folder Structure

All backend code lives inside the existing Next.js application. No separate directory or `package.json`.

```
nutritionapp2man/
│
├── app/
│   └── api/                              # Route Handlers
│       ├── auth/
│       │   ├── signup/route.ts
│       │   ├── login/route.ts
│       │   ├── me/route.ts
│       │   └── logout/route.ts
│       ├── users/
│       │   └── me/route.ts               # PATCH /api/users/me
│       ├── profile/
│       │   ├── route.ts                  # GET/PATCH /api/profile
│       │   └── password/route.ts         # PUT /api/profile/password
│       ├── meals/
│       │   ├── route.ts                  # GET/POST /api/meals
│       │   └── [id]/route.ts             # GET/DELETE /api/meals/[id]
│       ├── foods/
│       │   ├── route.ts
│       │   ├── categories/route.ts
│       │   └── [id]/route.ts
│       ├── water/
│       │   ├── route.ts                  # GET/POST /api/water
│       │   └── today/route.ts            # GET /api/water/today
│       ├── sleep/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── stats/
│       │   ├── route.ts                  # GET /api/stats
│       │   ├── weight/route.ts
│       │   ├── streaks/route.ts
│       │   └── achievements/route.ts
│       ├── dashboard/
│       │   ├── summary/route.ts
│       │   └── nutrition/route.ts
│       ├── export/route.ts
│       ├── import/route.ts
│       ├── admin/
│       │   ├── stats/route.ts
│       │   ├── users/
│       │   │   ├── route.ts
│       │   │   └── [id]/route.ts
│       │   ├── imports/
│       │   │   ├── route.ts
│       │   │   └── [id]/route.ts
│       ├── ai/                            # Already implemented
│       │   ├── health/route.ts
│       │   └── predict/route.ts
│       └── health/route.ts               # Already implemented
│
├── lib/
│   ├── auth/                             # Auth utilities
│   │   ├── jwt.ts                        # signToken, verifyToken
│   │   ├── password.ts                   # hashPassword, verifyPassword
│   │   └── get-user.ts                   # getUserFromRequest
│   ├── db/                               # Database layer
│   │   ├── prisma.ts                     # Prisma client singleton
│   │   └── repositories/                 # Database query functions
│   │       ├── user.repository.ts
│   │       ├── meal.repository.ts
│   │       ├── food.repository.ts
│   │       ├── profile.repository.ts
│   │       ├── sleep.repository.ts
│   │       ├── water.repository.ts
│   │       └── stats.repository.ts
│   ├── services/                         # Business logic
│   │   ├── auth.service.ts
│   │   ├── profile.service.ts
│   │   ├── meals.service.ts
│   │   ├── foods.service.ts
│   │   ├── sleep.service.ts
│   │   ├── water.service.ts
│   │   ├── stats.service.ts
│   │   └── export.service.ts
│   ├── validators/                       # Zod schemas
│   │   ├── auth.validator.ts
│   │   ├── profile.validator.ts
│   │   ├── meals.validator.ts
│   │   ├── foods.validator.ts
│   │   ├── sleep.validator.ts
│   │   ├── water.validator.ts
│   │   └── admin.validator.ts
│   ├── types/
│   │   ├── index.ts                      # Shared types (User, Meal, etc.)
│   │   └── api-response.ts              # successResponse, errorResponse
│   ├── api-helpers.ts                    # parseBody, parseQuery, handleApiError
│   ├── errors.ts                         # AppError, ValidationError, etc.
│   └── api-client/
│       └── model-client.ts              # ML service HTTP client
│
├── prisma/
│   ├── schema.prisma                     # Database schema
│   ├── migrations/                       # Migration history
│   └── seed.ts                           # Seed NigerianFoods + demo users
│
└── docs/
    ├── architecture-plan.md
    └── backend-contract.md               # This document
```

### Layer Responsibilities

| Layer | Path | Responsibility |
|---|---|---|
| **Route Handlers** | `app/api/**/route.ts` | HTTP concerns: parse request, validate, call service, format response |
| **Validators** | `lib/validators/` | Zod schemas — used by Route Handlers AND frontend forms |
| **Services** | `lib/services/` | Business logic, orchestration, transaction boundaries |
| **Repositories** | `lib/db/repositories/` | Database access only — Prisma queries, no business logic |
| **Auth** | `lib/auth/` | JWT sign/verify, password hashing, request user extraction |
| **Types** | `lib/types/` | Shared TypeScript interfaces and API response helpers |
| **Errors** | `lib/errors.ts` | Custom error classes with HTTP status codes |

### Route Handler Template

Every protected Route Handler follows this pattern:

```typescript
// app/api/meals/route.ts
import { NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/auth/get-user"
import { successResponse, errorResponse } from "@/lib/types/api-response"
import { handleApiError } from "@/lib/api-helpers"
import * as mealService from "@/lib/services/meals.service"

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return errorResponse("Authentication required", 401, "UNAUTHORIZED")

    const date = req.nextUrl.searchParams.get("date")
    const meals = await mealService.getMeals(user.id, date ? { date } : {})
    return successResponse({ meals })
  } catch (err) {
    return handleApiError(err)
  }
}
```

---

## 11. Implementation Roadmap

### Phase 3a: Database Foundation
1. Install Prisma: `npm install -D prisma && npm install @prisma/client`
2. Write `prisma/schema.prisma` from Section 3.2
3. Run `npx prisma migrate dev --name init`
4. Create `lib/db/prisma.ts` (singleton)
5. Write `prisma/seed.ts` — seed NigerianFoods (1461 lines from `app/data/nigerian-foods.ts`), 2 demo users
6. Dockerize PostgreSQL (optional — can use local install)

### Phase 3b: Authentication
1. Install `jose` (JWT) and `bcryptjs`
2. Create `lib/auth/jwt.ts`, `lib/auth/password.ts`, `lib/auth/get-user.ts`
3. Create `lib/validators/auth.validator.ts`
4. Create `lib/services/auth.service.ts`
5. Implement `POST /api/auth/signup`
6. Implement `POST /api/auth/login`
7. Implement `GET /api/auth/me`
8. Migrate auth context to call API

### Phase 3c: Core CRUD (in priority order)
1. **Food database** — reference data, no auth dependency (read-only)
   - `GET /api/foods`, `GET /api/foods/[id]`, `GET /api/foods/categories`
2. **Meals** — central feature
   - `POST /api/meals`, `GET /api/meals`, `DELETE /api/meals/[id]`
3. **Water** — simple upsert
4. **Sleep** — simple upsert
5. **Profile** — read/update
6. **Stats** — computed from meals
7. **Dashboard** — aggregated endpoints
8. **Export/Import** — JSON round-trip
9. **Admin** — role-gated

### Phase 3d: Frontend Migration
1. Add React Query provider
2. Build API client layer (`lib/api-client/`)
3. Migrate auth context
4. Migrate `useMeals` → React Query
5. Migrate `useProfile` → React Query
6. Migrate water/sleep trackers
7. Remove `lib/local-storage.ts`

---

## 12. Open Questions

These items should be discussed before or during implementation:

1. **Should meal nutrition totals be computed server-side or trusted from the client?** The current frontend computes `totalNutrition` and sends it with the meal. The backend could recompute it from the provided food data for integrity. **Recommendation:** Recompute server-side. The client sends food entries; the backend validates and calculates totals.

2. **Should `UserStats` be a real table or computed on-the-fly?** For a university project with <1000 users, on-the-fly computation from the Meals table is fast enough. A materialized table is simpler to implement but can drift. **Recommendation:** Start with a real table updated on meal create/delete. Switch to computed if maintenance burden grows.

3. **Should the NigerianFood catalog be mutable by users?** Currently, the frontend allows custom food entries (via `food-logger.tsx` — unused, and `meal-logger.tsx` — custom name+calories). **Recommendation:** Allow custom foods in Meals (MealFood.foodId is nullable, name is denormalized) but restrict catalog mutations to admin.

4. **Should `physical-activities` get a logging feature?** The component defines `ActivityEntry` but never persists it. This is out of scope for the current contract but the schema is designed to accommodate it easily by adding an `ActivityLog` table.

5. **Export format compatibility.** The existing export JSON structure should be preserved for backward compatibility with any existing user exports. The import endpoint should accept both the old format and any new format.

6. **Should food predictions be persisted?** The `FoodPrediction` table exists in the schema but is marked as optional (Phase 5+). Storing predictions enables a history view and analytics ("most commonly scanned foods"). This can be added later without schema changes.

7. **Handling the sleep tracker direct localStorage access bug.** The `sleep-tracker.tsx` bypasses `LocalDatabase` and reads/writes `localStorage` directly. During migration, this must use the API endpoint uniformly — fix the bug while migrating.

---

*This document is the authoritative backend specification. All future implementation phases should derive their tasks from this document. Deviations must be discussed and reflected back here.*
