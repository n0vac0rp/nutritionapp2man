# GluGuide — Frontend Redesign Plan (Execution Doc)

> **Purpose:** This doc is the single source of context for a fresh coding session that will
> implement the full GluGuide frontend redesign. Read it fully before writing code.
>
> **Stack:** Next.js 15 (App Router) + React 19 + TanStack Query + Tailwind + shadcn/ui + Prisma 7 + PostgreSQL. Single-page SPA: `app/page.tsx` gates to `AuthPage` or `Dashboard`.

---

## 1. Project layout (frontend-relevant files)

```
app/
  page.tsx                      # auth gate -> AuthPage | Dashboard (+Tutorial/RatingDialog)
  layout.tsx                    # forced dark theme: <html class="dark">, defaultTheme="dark", enableSystem=false
  providers.tsx                 # TanStack Query provider
  contexts/auth-context.tsx     # AuthProvider: user state, login/signup/logout, tutorial/rating flags
  hooks/use-meals.ts            # meals query/invalidation; useMeals(date?, startDate?, endDate?)
  hooks/use-profile.ts          # UserProfile data + update
  components/
    dashboard.tsx               # SINGLE SCREEN, 8-9 top-level Tabs (the thing being redesigned)
    auth-page.tsx               # login/signup (forced light bg)
    personalized-welcome.tsx    # greeting + stat tiles + achievements
    meal-logger.tsx             # 2-phase cart->meal flow (to be rewritten)
    ai-food-scanner.tsx         # image classification + add-to-meal
    nutrition-summary.tsx       # 7/14/30d avg macros + daily breakdown
    recommendations.tsx         # BMI-based food recs + cultural tips + sample meal plan
    bmi-calculator.tsx          # metrics + measurement form + static reference tables
    profile-settings.tsx        # tabbed: UserProfileDetails | settings (edit/export/backup)
    user-profile-details.tsx    # profile header + monthly/weekly meal analysis
    sleep-tracker.tsx           # sleep logging
    water-tracker.tsx           # water logging (goal hardcoded 2000)
    physical-activities.tsx     # STATIC ONLY — no backend, no logging UI (dead-end tab)
    tutorial.tsx                # 5-step onboarding overlay
    rating-dialog.tsx           # Google Form rating prompt
    portion-sizing-guide.tsx    # hand-based portion reference
    admin-dashboard.tsx         # admin stats + users
  utils/calculations.ts         # calculateBMI, getDailyCalorieRecommendation (Mifflin-St Jeor), calculatePortionWeight, calculateEnhancedHealthMetrics, analyzeNutritionIntake
  data/nigerian-foods.ts        # food DB — exactly 87 items (tutorial claims "500+" — WRONG)
app/api/
  auth/login|signup|logout|me   # auth
  users/me (PATCH)              # updateProfile target
  meals/ (GET/POST), meals/[id]/ (GET/DELETE — NO PATCH yet)
  water/ (GET/POST upsert), water/today/
  sleep/ (GET/POST upsert)
  profile/                      # UserProfile GET/PATCH
  stats/                        # totals/streaks/achievements
  export/
  admin/                        # stats, users, users/[id]
  ai/predict                    # image classification
  health/
lib/
  auth/get-user.ts              # requireUser(req) -> user (throws if no/invalid token)
  api-helpers.ts                # parseBody(req, zodSchema), handleApiError(err), successResponse(data)
  validators/*.validator.ts     # zod schemas (see sleep.validator.ts for the pattern)
  db/repositories/*.repository.ts  # data access (see sleep.repository.ts for the pattern)
  db/prisma.ts                  # prisma client
  api-client/index.ts           # api.get/post/patch/put/delete/upload; getToken()/setToken() (sessionStorage)
  errors.ts                     # ApiError, NotFoundError, etc.
prisma/schema.prisma            # models: User, UserProfile, Meal, MealFood, NutritionTotal, NigerianFood, UserStats, WaterIntake, SleepEntry, FoodPrediction, BMIHistory
prisma/migrations/              # 2 migrations exist (init, add_fist_circumference)
```

---

## 2. Confirmed UX problems (why we're redesigning)

### 2.1 Navigation & IA
- `dashboard.tsx` renders **8–9 top-level Tabs** (Overview, Log Meal, BMI, Nutrition, Tips, Profile, Sleep, Activities, +Admin) in a single `TabsList` grid — no hierarchy, no primary-action emphasis.
- **Water tracking is buried inside the Log Meal tab** (`dashboard.tsx:441`) while Overview shows a "Water Today" card with no inline add control.
- **Activities is a dead-end tab**: `physical-activities.tsx` is purely static cards + tips. No API route, no Prisma model, no logging UI. The `ActivityEntry` interface in the component is unused.

### 2.2 Meal logging flow
- Two-phase flow: search → **cart** ("Food Selection") → "Add All to Meal" → **separate** Save button. Two cards ("Food Selection", "{Type} Items") are easily confused.
- Meals can only be deleted + re-added, never edited (no PATCH endpoint).
- Always logs *today* — no date picker to backfill.

### 2.3 Redundant / bloated screens
- **BMI tab** mixes live metrics + a measurement-update form (duplicates Profile edit) + ~4 static reference tables (WHR standards, BMI categories, waist thresholds, calorie recommendation).
- Overview "Quick Health Tips" (`dashboard.tsx:417`) = same BMI recs as the Tips tab and BMI tab.
- `user-profile-details.tsx` monthly analysis overlaps `nutrition-summary.tsx`.
- Water goal hardcoded `2000ml` in `water-tracker.tsx`.

### 2.4 Onboarding & retention bugs
- **Tutorial never persists.** `completeTutorial`/`skipTutorial` in `auth-context.tsx:140-146` only flip local state; nothing calls the API. `User.tutorialCompleted` defaults `false`, so the tutorial re-appears on **every reload/login**. Same for `appRated`.
- Tutorial copy is misleading: claims "500+ foods" (DB has 87) and references a "main menu" that doesn't exist.
- Rating dialog fires **1.5s after login** (`auth-context.tsx:92-94`) and recurs every login because `appRated` is never set.

### 2.5 Consistency & polish
- Forced dark dashboard vs forced-light auth page (`auth-page.tsx` `bg-[#f5f5dc]`).
- Native `confirm()` for meal deletion (`dashboard.tsx:77`).
- Broken color classes: `recommendations.tsx:227` uses `bg-background ... text-white` (white-on-white if light mode ever enabled); hard-coded `text-white dark:text-gray-100` in `dashboard.tsx:430`.

---

## 3. Decisions already made (do not re-litigate)

1. **Full redesign** (all three phases below).
2. **Build activity logging** (new Prisma model + API + logging UI) — Activities becomes functional.
3. **Navigation**: desktop left **sidebar** + mobile **bottom nav** (5 items + "More" sheet). Replaces the top `TabsList` grid.
4. **Sleep** drops from top-level nav → becomes a compact quick-entry widget on **Today** (full tracker retained, accessible from Today).
5. **Analytics** reachable on mobile via the "More" sheet (not a bottom tab).

---

## 4. Target information architecture

| # | Destination | Content | Source components |
|---|---|---|---|
| 1 | **Today** | Greeting + stat tiles, today's meals, inline water quick-add, sleep quick-entry | `PersonalizedWelcome`, Overview cards + meal list, `WaterTracker`, new sleep quick card |
| 2 | **Log Meals** | Single-flow meal logger + AI scanner | `MealLogger` (rewritten), `AIFoodScanner` |
| 3 | **Activities** | NEW functional activity logger + today's burn | new `ActivityLogger`, reuse activity metadata/images from `physical-activities.tsx` |
| 4 | **Health** | BMI + waist/hip metrics, measurement update, personalized recs/tips | `BMICalculator` (trimmed), `Recommendations` |
| 5 | **Analytics** | Nutrition trends (7/14/30d) + monthly/weekly breakdown (merged) | `NutritionSummary` + monthly analysis from `user-profile-details.tsx` |
| 6 | **Profile** | Details, settings, goals (incl. water goal), export/backup | `ProfileSettings`, profile header from `UserProfileDetails`, new water-goal setting |
| 7 | **Admin** (role-gated) | Existing admin dashboard | `AdminDashboard` |

- Mobile bottom nav = **Today, Log, Activities, Health, Profile** + **More** sheet (Analytics, Admin).
- Desktop sidebar shows all 7.
- Nav state can stay as a single `activeTab` string in `dashboard.tsx` (or a small context) — no router changes required.

---

## 5. Phase 0 — Backend foundations

### 5.1 Activity logging (new feature)

**Prisma** (`prisma/schema.prisma`):
- Add model `ActivityEntry` mirroring `SleepEntry`'s shape:

```prisma
model ActivityEntry {
  id             String   @id @default(uuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date           DateTime @db.Date
  activityType   String
  durationMin    Float    // minutes
  intensity      String   // "light" | "moderate" | "vigorous"
  caloriesBurned Float
  notes          String?
  createdAt      DateTime @default(now())

  // No unique on [userId, date]: unlike a water/sleep daily total, several
  // separate activities in one day accumulate.
  @@index([userId, date])
}
```
- Add `activityEntries ActivityEntry[]` to `User`.
- Add `waterGoal Float @default(2000)` to `UserProfile` (kills the hardcoded 2000).
- Migrate: `npx prisma migrate dev --name add_activity_and_water_goal` (then `docker compose exec next-app npx prisma migrate deploy` if needed in container).

> **Revised after review:** this model was first shipped with `@@unique([userId, date])` +
> `upsert`, which made a second activity logged on the same day silently replace the first
> while the UI advertised a per-entry list. The constraint is dropped in
> `20260807001910_allow_multiple_activities_per_day`; entries are created, listed, and
> deleted individually.

**Validator** — new `lib/validators/activity.validator.ts` (follow `sleep.validator.ts`):

```ts
import { z } from "zod"

export const activityLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activityType: z.string().min(1).max(100),
  durationMin: z.number().min(1).max(1440),
  intensity: z.enum(["light", "moderate", "vigorous"]),
  notes: z.string().max(500).optional(),
})
```
- caloriesBurned computed server-side from a shared map (see 5.2) OR client-side and accepted by schema. Prefer **server-side computation** using the same calorie map so client and admin/API stay consistent.

**Repository** — new `lib/db/repositories/activity.repository.ts` (mirror `sleep.repository.ts`):
- `findByUserId(userId, opts?: { startDate?, endDate? })`
- `findById(id)` / `create(userId, date, data)` / `remove(id)` — one row per logged activity.

**Routes**:
- `app/api/activities/route.ts`: `GET` (list entries for user, optional date filters) + `POST` (create). Use `requireUser(req)`, `parseBody(req, activityLogSchema)`, `successResponse({ entry })`, `handleApiError(err)`.
- `app/api/activities/[id]/route.ts`: `DELETE` with the same ownership check as `meals/[id]`.
  (A `today/` route is unnecessary — the logger already fetches a 7-day window.)

**Calorie map** — reuse metadata from `app/components/physical-activities.tsx` (`activityTypes` array: name → `caloriesPerMinute: { light, moderate, vigorous }`). Move this data to a shared module, e.g. `app/data/activities.ts`, so both the frontend display and the API can import it. Add a reasonable default (≈4 cal/min) for unknown types.

### 5.2 Meal editing

- Add `PATCH` to `app/api/meals/[id]/route.ts` (mirror DELETE's ownership check: `requireUser` → `mealsService.getMeal(id)` → if `!meal || meal.userId !== user.id` throw `NotFoundError("Meal")`).
- Add an update function in `lib/services/meals.service.ts`: replace `MealFood[]` (delete + recreate) and recompute `NutritionTotal`. Reuse the existing meal-create logic for food/nutrition persistence.
- Add `updateMeal` to `app/hooks/use-meals.ts` (PATCH via `api.patch`, then invalidate `["meals", user?.id]` and `["stats", user?.id]`).

### 5.3 Tutorial / rating persistence (bug fix)

In `app/contexts/auth-context.tsx`:
- `completeTutorial` / `skipTutorial`: fire `updateProfile({ tutorialCompleted: true })` (async, non-blocking) then set local state. PATCH `/api/users/me` already accepts these fields (see `User` interface + `users/me` route).
- Rating: in `RatingDialog`, after a rating action (or the "Continue to App" after Google Form return), call `updateProfile({ appRated: true })`. Pass an `onRated`/`onClose` handler from `page.tsx` or extend auth-context with `markAppRated()`.
- Trigger rating prompt only when `user.tutorialCompleted && !user.appRated` (see Phase 2, `rating-dialog.tsx`).

---

## 6. Phase 1 — Navigation shell & IA

### New components
- `app/components/layout/app-nav.tsx` — desktop **left sidebar** (fixed/sticky, full labels + icons from `lucide-react`). Props: `activeTab`, `onTabChange`, `isAdmin`.
- `app/components/layout/mobile-nav.tsx` — fixed **bottom nav** (Today, Log, Activities, Health, Profile) + a **More** sheet (Analytics, Admin when admin). Props: same.
- Optionally `app/components/layout/more-sheet.tsx` for the More overlay.

### Refactor `dashboard.tsx`
- Remove the `TabsList` grid (lines 141-210) and the outer `<Tabs>` wrapper.
- Replace with:
  ```tsx
  <div className="flex min-h-screen">
    <AppNav ... />            {/* hidden on mobile */}
    <main className="flex-1 lg:pl-<sidebar width> ...">{renderSection(activeTab)}</main>
    <MobileNav ... />          {/* fixed bottom on mobile */}
  </div>
  ```
- Keep `activeTab` state + header (brand, avatar, logout). Keep the `isAdmin` gating.
- Each nav item maps to a render function / switch rendering the consolidated sections (Phase 2).

### IA mapping recap
Today → section `today`; Log Meals → `log`; Activities → `activities`; Health → `health`; Analytics → `analytics`; Profile → `profile`; Admin → `admin`.

---

## 7. Phase 2 — Consolidation & fixes

1. **Today section** (`today`):
   - `PersonalizedWelcome` (keep stat tiles).
   - Keep 4 stat cards (calories, BMI, meals, water) — make water card clickable to quick-add `+250ml` and show goal from profile `waterGoal` (falls back 2000).
   - Today's meals list (keep, but replace `confirm()` with a styled confirm `Dialog`).
   - Trim "Quick Health Tips" to 2 items + "See more in Health" link.
   - `WaterTracker` inline (moved out of Log) — keep compact; goal from `waterGoal`.
   - New compact **sleep quick-entry** card (hours + quality select + save, uses `/api/sleep`), linking to the full `SleepTracker` (render full tracker in an expandable or navigate to it within Today).

2. **Log Meals** (`log`): `MealLogger` (rewritten, Phase 3) + `AIFoodScanner`. Remove the old inline `WaterTracker` from this section.

3. **Activities** (`activities`): new `ActivityLogger` (Phase 3). Reuse images/metadata from `physical-activities.tsx` (now `app/data/activities.ts`). Remove the standalone static component or convert it into the logger + tips.

4. **Health** (`health`):
   - `BMICalculator` trimmed: metrics summary + "Update measurements" form **moved to Profile** (single source of truth). Static reference tables (WHR standards, BMI categories, waist thresholds) collapsed behind an expandable "About these metrics".
   - `Recommendations` moved here (was Tips tab). Remove standalone Tips tab.
   - Remove the duplicate "Daily Calorie Recommendation" card (shown on Today already) or keep only if it adds distinct value — prefer removing to reduce noise.

5. **Analytics** (`analytics`):
   - `NutritionSummary` becomes the primary surface (7/14/30d).
   - Absorb monthly/weekly analysis from `user-profile-details.tsx` (month/year selector, weekly cards, daily grid, macro trends) into this section (e.g., as sub-tabs "Daily Trends" / "Monthly"). Profile keeps only the header + settings.

6. **Profile** (`profile`):
   - `UserProfileDetails` **header** only (avatar, name, email, key metrics badges).
   - `ProfileSettingsForm` (edit form, cultural prefs, health goals, activity level, toggles).
   - Add **Water Goal** setting (numeric, stored via profile `waterGoal`).
   - Keep export/backup cards.
   - Move BMI measurement-update fields here (height/weight/waist/hip/fist) as one combined form with Profile's edit form.

7. **Rating dialog**: only open when `user.tutorialCompleted && !user.appRated`. Delay trigger to later in the session (e.g., on a later visit / after N meals), not 1.5s after login. Mark `appRated` on completion.

8. **Tutorial**: update copy — "80+ Nigerian foods" (actual count from `nigerian-foods.ts`, currently 87), remove "main menu" phrasing, and note nav destinations by their new names (Today / Log Meals / Activities / Health / Analytics / Profile).

9. **Color/consistency fixes**:
   - `recommendations.tsx:227`: `bg-background ... text-white dark:text-foreground` → use `text-foreground` (safe in both themes).
   - `dashboard.tsx:430`: `text-white dark:text-gray-100` → `text-foreground`.
   - Decide whether the app stays forced-dark (current) — if so, ensure auth page matches dark theme too (or intentionally light as a branded marketing screen; document the choice).

---

## 8. Phase 3 — Meal logger rewrite & activity UI

### 8.1 `MealLogger` single-flow rewrite
Replace the current cart → meal two-phase flow with:
- **Step 1 — Meal type + date**: `breakfast/lunch/dinner/snack` select + a date input (defaults today, allows backfill). Keep `portionWeightPerFist` hint.
- **Step 2 — Add foods**: search/filter the Nigerian DB (`filteredFoods` logic stays) and/or AI scan (keep `AIFoodScanner` integration, `handleFoodIdentified`).
- **Step 3 — Adjust portions**: each selected food has a **fist stepper** (`min 0.5, step 0.5`) + live per-food calories/grams. Remove the separate "Food Selection" cart card; keep a single **Meal Summary** card with totals (calories, protein, carbs, fats, grams).
- **Single Save**: one primary `Save {type}` button (calls `addMeal`, now also supports `date`).
- **Edit mode**: open an existing meal (from Today's list) → PATCH via `updateMeal`. Add an edit (pencil) action next to the delete action on today's meals.
- Keep the success/error inline `message` banner pattern.

### 8.2 `ActivityLogger`
- Grid/list of activity types (name + image + cal/min by intensity) from `app/data/activities.ts`.
- Select activity → intensity (light/moderate/vigorous) → duration (min) → shows computed calories (`durationMin * caloriesPerMinute[intensity]`).
- Save → POST `/api/activities` (upsert for the day). Show **today's total burn** and a small 7-day list.
- Keep the existing Activity Tips card.
- Empty state: "Log your first activity".

### 8.3 Frontend hook for activities
New `app/hooks/use-activities.ts` (mirror `use-meals.ts`):
- `useActivities(date? | startDate/endDate?)` query key `["activities", userId, ...]`.
- `logActivity`/`updateActivity` (POST upsert) + invalidate `["activities", userId]`.

---

## 9. What to verify / not break

- **Auth**: `useAuth().user.role` gates Admin. `requireUser` used in every new route.
- **API shape**: every route returns `successResponse({ ... })` → client reads `.data` via `api.get<T>().then(r => r...)`. `api-client` unwraps `json.data` already, so handlers receive the inner object (e.g. `{ entry }`, `{ meals }`).
- **Prisma 7**: client generated to `../generated/prisma`; run `npx prisma generate` after schema edits; run migration before testing.
- **TanStack Query**: invalidate `["meals", userId]` and `["stats", userId]` after add/delete/update; activity mutations invalidate `["activities", userId]` and optionally `["stats", userId]`.
- **Existing screens to preserve behavior for**: admin dashboard, export/backup, AI scanner, portion guide (keep `PortionSizingGuide` reachable from MealLogger).

## 10. Verification commands

```bash
npx tsc --noEmit          # typecheck
npm run lint              # eslint
docker compose up --build # run app
```
Manual flow test:
1. Sign up → tutorial shows → complete → **reload** → tutorial must NOT reappear.
2. Log a meal (single save) → appears on Today → edit it → delete via Dialog (no native confirm).
3. Log an activity → Today/total updates.
4. Add water on Today (+250) → goal reflects profile `waterGoal`.
5. Analytics reflects logged data across 7/14/30d.
6. Admin sees sidebar Admin item; mobile shows bottom nav + More sheet.

---

## 11. Open items (flag during implementation)
- Whether the app remains **forced dark** (current `layout.tsx`) or theme toggle is introduced. Keep forced-dark unless instructed otherwise.
- Whether "Weekly meal plan / cultural tips" content in `Recommendations` survives in Health as-is or is trimmed.
- Activity calorie map: confirm the `caloriesPerMinute` values in `physical-activities.tsx` are the source of truth (they are the only existing data).
