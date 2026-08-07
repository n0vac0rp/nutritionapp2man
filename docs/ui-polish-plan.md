# GluGuide UI Polish & Bug Fix Plan

Targets: tutorial persistence bug, auth response unwrapping, cursor states, UI primitive defects, and typography/hierarchy consistency.

## Context

- Forced-dark app (`app/layout.tsx`: `<html class="dark">`, `ThemeProvider defaultTheme="dark"`).
- All API responses are wrapped as `{ success, data }`; `lib/api-client` unwraps `json.data`, so handlers receive the inner object (e.g. `{ user }`, `{ meals }`).
- Tailwind v4 preflight does NOT set `cursor: pointer` on buttons.
- No schema/migration or dependency changes required for this plan.

## Phase A — Bug fixes

1. `app/contexts/auth-context.tsx` — fix response envelope unwrapping (root cause of the tutorial reappearing on reload):
   - `checkAuth`: currently `const u = await api.get<User>("/api/auth/me")` reads `u.tutorialCompleted` which is `undefined` because the API returns `{ user }`. Fix:
     ```ts
     const { user: u } = await api.get<{ user: User }>("/api/auth/me")
     setUser(u)
     if (!u.tutorialCompleted) setShowTutorial(true)
     ```
   - `updateProfile`: currently `const updated = await api.patch<User>("/api/users/me", updates)` then `setUser(updated)`, which sets the user state to `{ user: {...} }`. Fix:
     ```ts
     const { user: updated } = await api.patch<{ user: User }>("/api/users/me", updates)
     setUser(updated)
     ```
   - Result: tutorial shows once; completing OR skipping persists `tutorialCompleted=true` (DB already does this) → never reappears on reload or re-login.

2. `app/components/meal-logger.tsx` — default `inputMode` to `"scan"` (currently `"search"`):
   - `useState<"scan" | "search">("scan")`

## Phase B — Cursor + UI primitives

3. `app/globals.css` — add interactive cursor rule:
   ```css
   @layer base {
     button:not(:disabled) { cursor: pointer; }
   }
   ```

4. `app/components/layout/app-nav.tsx` and `app/components/layout/mobile-nav.tsx` — add `cursor-pointer` to nav buttons and More-sheet buttons.

5. `components/ui/card.tsx` — replace broken base styles:
   - Current: `bg-card text-white dark:text-card-foreground w-auto border-[10px] rounded shadow-none mx-0 px-6 flex-col justify-center items-start py-6`
   - Target: `bg-card text-card-foreground border border-border rounded-lg shadow-sm` (remove the 10px border, `text-white`, `shadow-none`, stray `px-6`/`py-6`).

6. `components/ui/input.tsx` — fix inverted colors:
   - Current ends with `bg-foreground text-background`.
   - Target: `bg-background text-foreground`.

7. `app/components/dashboard.tsx` — brand text: `text-green-800` → `text-green-600` (contrast on dark card).

## Phase C — Typography & hierarchy (full pass)

8. New `app/components/layout/section-header.tsx`: renders section title (`text-xl font-bold`) + optional description (`text-sm text-muted-foreground`). Use at top of each section.

9. Standardize typography across sections and screens:
   - Section pages: `sections/today-section.tsx`, `log-section.tsx`, `activities-section.tsx`, `health-section.tsx`, `analytics-section.tsx`, `profile-section.tsx` — add `SectionHeader`.
   - Also touch: `meal-logger.tsx`, `activity-logger.tsx`, `water-tracker.tsx`, `sleep-tracker.tsx`, `bmi-calculator.tsx`, `nutrition-summary.tsx`, `monthly-analysis.tsx`, `user-profile-details.tsx`, `profile-settings.tsx`.
   - Rules:
     - Card titles: `text-base font-semibold` (drop `text-sm xs:text-base` / `text-lg sm:text-xl` ad-hoc chains).
     - Stat values: `text-2xl font-bold`.
     - Body: `text-sm`.
     - Labels/descriptions: `text-xs font-medium text-muted-foreground`.
     - Remove leftover `text-xs xs:text-sm sm:text-base` class chains.

10. `components/ui/select.tsx` — replace hardcoded colors with theme tokens:
    - `SelectContent`: `bg-black text-white` → `bg-popover text-popover-foreground`.
    - `SelectItem`: `focus:bg-gray-800 focus:text-white` → `focus:bg-accent focus:text-accent-foreground`.
    - Review `components/ui/dialog.tsx` for similar hardcoded grays and align.

## Verification

- `npx tsc --noEmit`
- `npm run lint`
- `docker compose up --build` (postgres/migrate/model-service/next-app), then:
  1. Complete tutorial → reload → must NOT reappear.
  2. Skip tutorial (X) → reload → must NOT reappear.
  3. Cards show normal border + shadow (no 10px border).
  4. Inputs match dark theme (no inverted bright boxes).
  5. Sidebar + mobile nav + More sheet buttons show pointer cursor.
  6. Meal Logger opens on the Scan tab by default.
  7. Section pages have consistent headings; typography is uniform.
