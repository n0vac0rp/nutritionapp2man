# GluGuide — Defense Preparation Guide

> **Purpose:** Fast reference for presenting and defending the GluGuide project.
> Read `docs/project-defense.md` for the full technical report. This doc covers the pitch, the walkthrough, the live demo, and the most likely questions — with model answers.

---

## 1. The 30-Second Elevator Pitch

> "GluGuide is a smart nutrition monitoring system for Nigerian diets. It lets users log meals from a database of Nigerian foods, track water, sleep, and physical activity, compute health metrics like BMI and daily calorie recommendations, and — the standout feature — take a photograph of a meal and have a deep-learning model identify the food and suggest logging it. It's a full-stack application: a Next.js and React frontend backed by PostgreSQL, exposed through a REST API, with the AI classifier running as a separate FastAPI microservice. Everything is containerized with Docker and deployable with one command."

---

## 2. Why This Project (motivation talking points)

- Nigerian staple foods (amala, eba, pounded yam, semo, jollof rice, egusi) are poorly represented in Western calorie apps — users couldn't track what they actually eat.
- Portion awareness is a genuine problem; the app ties logging to familiar "fist" and "ladle" portion sizes and a portion-sizing guide.
- It is **end-to-end**: database design, REST API design, frontend engineering, ML model training, microservice integration, and deployment — a complete showcase.
- It solves a locally relevant problem, which makes it memorable and defensible.

---

## 3. Architecture Walkthrough (3-5 minute talk)

Structure the talk around one diagram and three sentences per layer:

1. **One app, two pieces of "backend".** The Next.js app is both the UI and the API server (Route Handlers). Data lives in PostgreSQL (Prisma ORM). A separate Python/FastAPI service runs the AI model.
2. **Flow of a request.** Browser → `/api/meals` (same-origin, Bearer JWT) → Route Handler validates with Zod → Service applies business logic → Repository runs the Prisma query → PostgreSQL → response wrapped in `{ success, data }`.
3. **Flow of an AI scan.** Browser uploads a photo → `/api/ai/predict` validates the file → forwards to the model service → EfficientNet-B0 classifies → confidence scores return → UI shows the top match, which can be logged as a meal.
4. **Security.** bcrypt password hashing, stateless JWT (7-day), ownership scoping, admin role gate, input validation, and password-hash sanitization.
5. **Ops.** `docker compose up --build` runs postgres (migrations + seed auto-run), the Next.js app, and the model service with health checks and ordered startup; production deployment on Render.

---

## 4. Live Demo Script

> Time-box: ~5 minutes. Have the app running (`docker compose up --build`) before the defense.

1. **Home / signup** — register a test account (brief form: name, email, age, height, weight).
2. **Tutorial** — show the onboarding overlay, complete it, then **reload the page** and point out it does NOT reappear (fixes a real bug — persistence).
3. **Today view** — greeting, stat tiles, water quick-add, sleep quick-entry.
4. **Log a meal** — pick a date, choose a food from the searchable Nigerian catalog, adjust portion with the fist stepper, single Save. Show the meal appear on Today with computed calories/macros.
5. **AI scanner** — upload a food photo → confidence bars → highlight top match → **"Log as Meal"**.
6. **Water & sleep** — add 500 ml, log a night's sleep.
7. **Activities** — log an activity, show today's burn.
8. **Analytics** — 7/14/30-day nutrition trends reflecting the logged data.
9. **Admin** (optional, if an admin account exists) — app stats and user list.
10. **Under the hood** (2 minutes) — `psql`/Prisma Studio to show real rows, `GET /api/health` JSON, maybe a `curl` to the model service `/health`.

**Demo pitfalls to avoid:** cold-starting the model service right before scanning (weights load ~5-10 s), entering a meal date in the future (validation rejects it), uploading a non-food image (confidence collapses — have a good sample ready).

---

## 5. Anticipated Defense Questions & Model Answers

### 5.1 Project choice & scope

**Q: Why did you choose this project?**
A local, practical problem — Nigerian foods aren't in mainstream tracking apps. It let me cover the full stack including a real ML component, which is why I scoped it this way.

**Q: Who are the users?**
Individual users tracking nutrition/health, and an admin who monitors adoption (user counts, activity). Personas are simple, so I kept the model to two roles.

### 5.2 Architecture decisions

**Q: Why Next.js instead of a separate Express/FastAPI backend?**
Single codebase and deployment, shared TypeScript types across frontend and API, fewer containers, and App Router Route Handlers are production-ready. The only genuinely separate backend is the Python model service, which has to be separate (see below).

**Q: Why keep the ML service separate?**
PyTorch is Python. Running it inside Node would need `child_process` hacks or a subprocess. A microservice gives clean separation of concerns, independent scaling, and easy model replacement.

**Q: Why PostgreSQL, not MongoDB?**
The data is inherently relational — User owns Meals which own Foods. Relational integrity, joins, and transactions matter. PostgreSQL also has great Docker support and free cloud tiers.

**Q: Why Prisma over Drizzle (or raw SQL)?**
Type-safe generated client, declarative schema, built-in migrations, Prisma Studio for visual debugging. Drizzle is lighter but requires more manual SQL/joins for this 11-model relational schema.

**Q: Why JWT and not sessions / Auth.js / OAuth?**
Stateless — no server-side session store, trivial to test with curl, well-documented. bcrypt for password storage. Documented upgrade path to httpOnly cookies or an OAuth provider.

**Q: Why Zod?**
TypeScript-first, shared between client forms and server handlers so the client can't drift from server validation. Already integrated with react-hook-form.

**Q: Why React Query (TanStack Query) rather than Redux?**
Most state here is *server state* (meals, water, stats) — React Query gives caching, background refetch, and optimistic updates with far less boilerplate than Redux. Local/UI state stays in React Context.

### 5.3 Database & business logic

**Q: Explain your schema.**
Eleven models rooted at User: 1:1 UserProfile/UserStats, 1:many meals (each with foods and a nutrition total), water, sleep, activities, predictions, BMI history, plus the NigerianFood reference catalog. UUID keys, cascade deletes, unique-per-day upserts for water/sleep.

**Q: How do you handle one water/sleep entry per day?**
`@@unique([userId, date])` plus an `upsert` — create if missing, update if present. Activities deliberately allow multiple per day (you can run AND swim).

**Q: How do streaks and achievements work?**
They're derived, not stored as truth. On every meal create/delete the service recomputes totals, average calories, favorite food, streaks (consecutive days with a meal), and achievement unlocks into UserStats. Atomic with the meal transaction.

**Q: Why denormalize nutrition onto MealFood?**
Historical accuracy. If we reference the catalog live and the catalog changes, old meals silently change. Snapshotting values at log time preserves history.

**Q: How is the food catalog seeded?**
`prisma/seed.ts` upserts 47 foods from the original hardcoded dataset. Idempotent — safe to re-run in CI or Docker startup.

### 5.4 AI/ML

**Q: Walk us through the model.**
EfficientNet-B0 pretrained on ImageNet; feature extractor frozen; a new classifier head trained on 15 epochs with Adam (lr 0.001), input 224×224 with ImageNet normalization and light augmentation (flip, rotation, color jitter). Trained in Google Colab. Outputs softmax probabilities over Amala, Eba, Pounded Yam, Semo.

**Q: Why transfer learning?**
Small dataset, big pretrained representations. Freezing the backbone and training only the head is the standard, fast, and accurate approach for a 4-class problem — we don't have the data to train from scratch.

**Q: How accurate is it?**
The repo includes the evaluation artifacts: training/validation accuracy curves, a test-set confusion matrix, and sample predictions (see `model/Second run/`). Exact figures are in `methodology and results.docx`. [Insert your headline accuracy here, e.g. "~87% test accuracy" — say the number confidently.]

**Q: Why did you train on a specific 4 classes?**
These are the most common Nigerian swallows and were the classes we could assemble a clean dataset for. The architecture generalizes — add classes, re-run the notebook, swap the weights.

**Q: How does inference run without a GPU?**
EfficientNet-B0 is the smallest, fastest EfficientNet family member — single-image CPU inference is ~30-280 ms. We load weights once at startup and keep them in memory.

**Q: What if the model is wrong?**
The UI shows all confidence scores and warns on low-confidence predictions; users can always log manually. Validation also rejects non-images and oversize files at two layers (Next.js proxy + FastAPI).

**Q: How is the model served?**
A FastAPI service with `/predict` and `/health`. The Next.js Route Handler validates and proxies to it. This gives auto-generated OpenAPI docs and Pydantic response validation.

### 5.5 Security

**Q: How do you store passwords?**
bcrypt, cost 12, via bcryptjs (pure JS — no native build issues). We removed the original plaintext-localStorage storage.

**Q: How does auth work end to end?**
Login verifies the hash and returns a JWT (jose, HS256, `sub`=userId, 7 days). The client sends `Authorization: Bearer <token>`. `requireUser()` verifies it on every protected route; admin routes also check `role === "ADMIN"`.

**Q: Can users see each other's data?**
No — every query is scoped to the `userId` from the token, and resource routes (meals, activities) verify ownership before acting.

**Q: How do you protect against bad input / abuse?**
Zod validation before any logic, upload size + format whitelists, and container memory limits. Rate limiting on auth endpoints is on the future-work list.

**Q: Any secrets in the repo?**
No — `.env` is gitignored; Render uses synced secrets for `DATABASE_URL` and `JWT_SECRET`. The docker-compose value is an explicit placeholder.

### 5.6 Testing & quality

**Q: How did you test this?**
Phase-based validation: production build, ESLint, strict TypeScript (zero errors), API smoke tests with curl/Postman covering success + error paths, manual UI walkthroughs, and container-level tests (migrations, idempotent seed, health checks, persistence across restarts). [Acknowledge:] We don't yet have an automated test suite — it's the top item on the roadmap.

**Q: Show me something that went wrong and how you fixed it.**
Strong options: (1) The tutorial kept reappearing every reload — root cause was the frontend reading `u.tutorialCompleted` where the API actually returned `{ user: { tutorialCompleted } }`; fixed by unwrapping the response envelope correctly. (2) Activities silently overwrote each other on the same day because of a `@@unique` + upsert design — dropped the constraint and made entries create/list/delete individually. (3) Two "latest" UI libraries broke the build after upgrades — pinned react-day-picker to v9 and rewrote recharts/resizable types to match v3/v4 APIs.

**Q: What's the biggest technical debt / limitation?**
The classifier only knows 4 foods; there's no automated test suite; auth rate limiting and prediction-history persistence are not yet wired in. I'd fix the test suite and expand the dataset next.

### 5.7 Deployment & operations

**Q: How do you deploy?**
Local: `docker compose up --build` runs postgres + migrations + seed + app + model service with health checks. Cloud: Render runs the web app and model service as two Docker services; Postgres is a managed instance.

**Q: Why health checks and ordered startup?**
The app must not start before the database is ready, and the model service is slow to warm (weights load at startup). `depends_on` with health conditions plus a `migrate` service that runs migrations/seed to completion before the app starts.

**Q: Why a multi-stage Dockerfile?**
Smaller, safer images — build toolchain in one stage, runtime copy of only production files, run as a non-root user, using Next.js `output: "standalone"`.

---

## 6. Cheat Sheet (numbers to have memorized)

| Fact | Value |
|---|---|
| App name | GluGuide — Smart Nutrition Monitoring System |
| Frontend | Next.js 16 / React 19 / TypeScript / Tailwind v4 / shadcn-ui / TanStack Query |
| Backend | Next.js Route Handlers (~30 REST endpoints) + Zod |
| Database | PostgreSQL 16 + Prisma 7 (11 models, 7 enums, 4 migrations) |
| Food catalog | 47 Nigerian foods seeded (idempotent) |
| Auth | JWT (jose, HS256, 7-day) + bcrypt (cost 12) |
| ML model | EfficientNet-B0, transfer learned, 4 classes, 15 epochs, Adam lr 0.001, 224×224 |
| Model weights | 16.3 MB `.pth` + `class_names.json` |
| Model service | FastAPI :3002, `/predict` + `/health`, CPU inference ~30-280 ms |
| Uploads | JPEG/PNG/WebP, ≤ 10 MB |
| Infra | Docker Compose (postgres, migrate, model-service, next-app) + Render |
| Demo login | Register via the signup form; admin role set via database |
