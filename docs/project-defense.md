# GluGuide — Smart Nutrition Monitoring System
## Project Defense Technical Report

> **Project:** GluGuide — a Nigerian nutrition tracking application with AI-powered food classification
> **Repository:** https://github.com/Wolext4/nutritionapp2man
> **Status:** Complete and deployable (Docker Compose + Render)
> **Companion document:** `docs/defense-prep.md` (presentation and Q&A preparation)

---

## 1. Project Overview

### 1.1 Problem Statement

Nigerian diets are rich in a distinct set of staple foods — swallows (amala, eba, pounded yam, semo), jollof rice, beans, egusi, and local soups — yet most nutrition-tracking applications use generic Western food databases. Users cannot easily log the foods they actually eat, portion sizes are misunderstood, and there is no way to identify a food from a photograph.

### 1.2 Proposed Solution

**GluGuide** is a full-stack web application that lets users:

- Register and log in with secure, hashed credentials (JWT sessions)
- Log meals using a searchable database of **47 Nigerian foods** with per-100g nutrition data
- Track water intake (daily goal, quick-add buttons) and sleep (duration + quality)
- Compute BMI, waist-to-height ratio, waist-to-hip ratio, and daily calorie recommendations
- Take a **photograph of a food** and have it classified by a trained deep-learning model
- View personalized recommendations, nutrition analytics (7/14/30-day trends), achievements and logging streaks
- Export and back up their data as JSON
- Admins can view app-wide statistics and all registered users

### 1.3 Scope of the Build

| Layer | What was built |
|---|---|
| Frontend | Single-page React app (Next.js App Router) with dashboard, meal logger, AI scanner, health metrics, analytics, sleep, water, activities, profile, and admin screens |
| Backend | ~30 REST endpoints implemented as Next.js Route Handlers with layered service/repository architecture |
| Database | PostgreSQL schema (11 models), 4 migrations, seeded food catalog |
| AI/ML | A 4-class food-image classifier (EfficientNet-B0) exposed as a standalone FastAPI microservice |
| DevOps | Full Docker Compose orchestration, multi-stage Docker images, health checks, cloud deployment on Render |

---

## 2. Technology Stack

| Category | Technology | Version | Role |
|---|---|---|---|
| Frontend framework | **Next.js** (App Router) | 16.3.0 | UI + server-side rendering + Route Handler backend |
| UI library | **React** / React DOM | 19.2.8 | Component model |
| Language | **TypeScript** | ^5 | Type safety across the whole stack |
| Styling | **Tailwind CSS** | 4.3.3 | Utility-first styling |
| Component library | **shadcn/ui** (Radix primitives) | latest | Accessible UI primitives (buttons, dialogs, selects, tabs) |
| Server state | **TanStack Query** | ^5.101.4 | Data fetching, caching, optimistic updates |
| Forms/validation | **Zod** | 4.4.3 | Shared client/server validation schemas |
| ORM | **Prisma** | 7.9.1 | Type-safe database access, migrations, seeding |
| Database | **PostgreSQL** | 16 | Relational persistence |
| Auth | **jose** (JWT) + **bcryptjs** | ^6 / ^3 | Token signing + password hashing |
| HTTP client | native `fetch` | — | Same-origin API + server-side model-service client |
| ML framework | **PyTorch** / torchvision | >=2.9 | Model training (Colab) and inference |
| ML API | **FastAPI** + uvicorn + Pydantic | — | Model inference microservice |
| Containerization | **Docker** + Docker Compose | — | Local and production packaging |
| Cloud hosting | **Render** | — | Web app + model service deployment |

### 2.1 Why Next.js as a full-stack framework (instead of a separate Express backend)

- **Single codebase, single deployment** — no separate API server to build, secure, or maintain
- **Type sharing** — one `tsconfig.json`; TypeScript types flow between components, hooks, services, and Route Handlers with no duplication
- **Three Docker services instead of four** — less networking, fewer environment variables
- **Route Handlers are production-ready** — native streaming, middleware, and edge-runtime support
- **Gradual adoption** — API routes were added incrementally without restructuring the frontend

### 2.2 Why PostgreSQL + Prisma

- The data model is inherently relational (User → Meal → MealFood → NigerianFood) — a poor fit for document stores
- Prisma gives type-safe generated clients, an intuitive schema language, a built-in migration system, and **Prisma Studio** for visual database inspection (valuable for a defense demo)
- **Drizzle ORM was evaluated and rejected** — Prisma's declarative schema and automatic join handling win for a relational model of this size

### 2.3 Why a separate FastAPI model service (instead of in-process Python)

- The trained model is a PyTorch artifact; running it inside a Node process would require fragile `child_process` hacks
- Clean separation of concerns — the model service does pure inference and nothing else
- Independently scalable; the Python stack (PyTorch) never pollutes the Node stack
- FastAPI auto-generates OpenAPI docs, has built-in async, and validates with Pydantic (the Python analogue of Zod)

---

## 3. System Architecture

### 3.1 Service Layout

```
┌───────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  POST /api/ai/predict (multipart) │  REST / JSON (same-origin)│
└───────────────┬───────────────────┬───────────────────────────┘
                │                   │
                ▼                   ▼
┌──────────────────────────────────────────────┐
│              next-app   (port 3000)          │
│   Next.js 16 — React 19 (SSR + Client)      │
│   ├── React Query (server state)            │
│   ├── Route Handlers (REST API)             │
│   │   ├── Auth (JWT)                        │
│   │   ├── Meals / Water / Sleep / Activities│
│   │   ├── Profile / Stats / Admin           │
│   │   └── /api/ai/predict (proxy + validate)│
│   └── Layers: Handler → Validator → Service │
│        → Repository → Prisma Client         │
└───────┬──────────────────────────┬──────────┘
        │ DATABASE_URL             │ MODEL_SERVICE_URL
        ▼                          ▼
┌────────────────────┐   ┌────────────────────────────┐
│   postgres :5432   │   │  model-service :3002       │
│   PostgreSQL 16    │   │  FastAPI + PyTorch         │
│   Prisma migrations│   │  EfficientNet-B0           │
└────────────────────┘   │  POST /predict, GET /health│
                         └────────────────────────────┘
```

**Communication rules**

- The browser only ever talks to `next-app` on the same origin (`/api/*`) — no CORS configuration required
- Route Handlers are the **only** code that talks to PostgreSQL (via Prisma) and the only code that talks to the model service
- The model service is a pure inference engine: **no database access, no business logic, no authentication**
- Inter-container communication uses Docker DNS (service names as hostnames, e.g. `http://model-service:3002`)

### 3.2 Backend Layering

| Layer | Location | Responsibility |
|---|---|---|
| **Route Handlers** | `app/api/**/route.ts` | HTTP concerns: parse request, validate, call service, format response |
| **Validators** | `lib/validators/` | Zod schemas — shared between Route Handlers and client forms |
| **Services** | `lib/services/` | Business logic and orchestration (e.g. `recalcStats` after meal changes) |
| **Repositories** | `lib/db/repositories/` | Database access only — Prisma queries, no business logic |
| **Auth** | `lib/auth/` | JWT sign/verify, bcrypt hashing, user extraction from requests |
| **API client** | `lib/api-client/` | Server-side model-service HTTP client; browser-side fetch wrapper |

### 3.3 API Response Convention

Every endpoint returns a consistent envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Human-readable message", "code": "ERROR_CODE" }
```

This uniform contract simplifies the frontend API client, which unwraps `json.data` so handlers receive the inner object directly.

### 3.4 Error Model

Custom error classes map to HTTP status codes:

| Class | HTTP | Code |
|---|---|---|
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `AppError` (base) | configurable | configurable |

---

## 4. Development Process

The project evolved through a documented, phased process. Each phase ended with a completion report recording what was built and how it was validated.

### 4.1 Origin: a client-side prototype (v0.dev)

GluGuide started as a fully client-side prototype generated with v0.dev:

- All data lived in browser `localStorage` behind a single 1,042-line `LocalDatabase` class
- Passwords were stored in plaintext; auth was a mock
- The 1,461-line food database was hardcoded in a TypeScript file
- A trained model existed (16.3 MB `.pth` file) but was never wired into the app

### 4.2 Phase 1 — Foundation & cleanup

Removed ~2.5 MB of duplicate/dead files (nested repo duplicates, dead CSS, orphaned images), configured ESLint, upgraded Next.js, verified `build`/`dev`/`lint` all pass.

### 4.3 Phase 2 — Backend infrastructure

Created the API directory skeleton, shared TypeScript types, API response helpers, error classes, Zod-powered request parsing helpers, and the `GET /api/health` endpoint.

### 4.4 Phase 3 — Database & persistence layer

Introduced PostgreSQL 16 (Docker) + Prisma with an **11-table schema**, repository layer, auth utilities (JWT + bcrypt), Zod validators, service stubs, and a health endpoint with a live DB connectivity check.

### 4.5 Phase 4 — AI integration (proxy layer)

Built the communication layer: server-side model client, health proxy, prediction proxy with image validation, and the frontend **AI Food Scanner** component — the first working browser → Next.js → FastAPI → PyTorch pipeline.

### 4.6 Phase 5 — Model service

Created the standalone FastAPI microservice: lifespan-based model loading, a preprocessing pipeline that exactly replicates the training notebook (resize 224×224, ToTensor, ImageNet normalization), inference with softmax + confidence scoring, `/health` and `/predict` endpoints.

### 4.7 Phase 6 — Application API layer

Implemented **27 Route Handlers across 10 feature groups** (auth, users/profile, meals, foods, water, sleep, stats, dashboard, export, admin). Every protected endpoint verifies the JWT; password hashes are stripped from all responses via `sanitizeUser()`.

### 4.8 Phase 7 — Frontend migration

Replaced every `LocalDatabase`/`localStorage` reference with real API calls and installed React Query for server state. **Deleted `lib/local-storage.ts` (1,042 lines)** and the legacy seeding script. Verified zero remaining `local-storage` references.

### 4.9 Phase 8 — Feature completion

Seeded the food catalog (47 foods, idempotent upsert), implemented automatic stats recalculation on meal create/delete (streaks, totals, favorite food, achievements), BMI-history tracking on weight change, an AI-scan → "Log as meal" workflow, and React Query invalidation for dashboard auto-refresh. Removed 4 dead components.

### 4.10 Phase 9 — Dockerization

`docker compose up --build` brings the entire system up: PostgreSQL (migrations + seed run automatically via `scripts/migrate.sh`), the Next.js app, and the model service — each with health checks and ordered startup.

### 4.11 Post-deployment engineering passes

After the core phases, the project went through three additional engineering passes:

1. **Frontend redesign** — replaced the top tab-grid with a desktop sidebar + mobile bottom navigation, consolidated 8-9 tabs into 7 sections (Today, Log, Activities, Health, Analytics, Profile, Admin), rewrote the meal logger as a single-flow, added a functional **activity logger** (new Prisma model + API + UI), and moved water/sleep into the Today view.
2. **Repository modernization** — resolved dependency API breakages (react-day-picker v10→v9 pin, recharts v3 types, react-resizable-panels v4 renames), fixed type/lint issues, and enabled build-time type + lint checks. Achieved **zero** TypeScript errors, **zero** ESLint errors, green build.
3. **UI polish & bug fixes** — fixed the tutorial-persistence bug (API envelope unwrapping), added interactive cursors, repaired broken card/input/select styles, and standardized typography across sections.

---

## 5. Database Design

### 5.1 Models (11)

| Model | Relationship | Purpose |
|---|---|---|
| `User` | root | Auth, personal info, role, health/fitness arrays, tutorial/rating flags |
| `UserProfile` | 1:1 with User | Preferences, meal prefs, settings, targets, water goal |
| `Meal` | 1:many with User | Meal log metadata (type, date, time, mood, notes) |
| `MealFood` | 1:many with Meal | Individual foods within a meal, denormalized per-portion nutrition |
| `NigerianFood` | catalog (referenced by MealFood) | Reference food data, per-100g nutrition + portion estimates |
| `NutritionTotal` | 1:1 with Meal | Meal-level nutrition aggregate, computed at creation |
| `UserStats` | 1:1 with User | Totals, streaks, achievements, favorite food |
| `WaterIntake` | 1:many with User | Daily water (unique per user+date, upsert) |
| `SleepEntry` | 1:many with User | Daily sleep (unique per user+date, upsert) |
| `ActivityEntry` | 1:many with User | Activity logs (multiple per day allowed) |
| `FoodPrediction` | 1:many with User | AI classification history (JSONB predictions) |
| `BMIHistory` | 1:many with User | Weight/BMI time series |

*(7 enums: `Gender`, `Role`, `ActivityLevel`, `Units`, `MealType`, `Mood`, `SleepQuality`)*

### 5.2 Key Design Principles

1. **UUID primary keys** — consistent with the original data model, safe for API exposure, no enumeration risk
2. **Cascade deletes** — deleting a User removes all owned data; no orphaned records
3. **Denormalized nutrition on `MealFood`** — nutrition is captured at log time, so later catalog edits never corrupt history
4. **Upsert patterns** — `WaterIntake` and `SleepEntry` enforce one row per user per day via `@@unique([userId, date])`
5. **JSONB for flexible data** — `FoodPrediction.allPredictions` stores the prediction list as JSON
6. **PostgreSQL arrays for simple lists** — health conditions, fitness goals, achievements, etc. avoid join tables for pure value lists
7. **Nullable `MealFood.foodId`** — supports custom/manual food entries not in the catalog
8. **4 migrations** — `init`, `add_fist_circumference`, `add_activity_and_water_goal`, `allow_multiple_activities_per_day`

### 5.3 Seeding

`prisma/seed.ts` populates the `NigerianFood` catalog with **47 foods** across 9 categories (Whole Grains and Tubers, Legumes, Nuts and Seeds, Fruits, Vegetables, Milk and Milk Products, Meat/Fish/Poultry, Oils and Fats, Beverages). It uses `upsert`, so it is idempotent and safe to re-run.

---

## 6. REST API

### 6.1 Endpoint Inventory (all under `/api/`)

| Group | Endpoints | Auth |
|---|---|---|
| Health | `GET /health` | Public |
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` | login/signup public, rest Bearer |
| User | `PATCH /users/me` (creates BMI history on weight change) | Bearer |
| Profile | `GET /profile`, `PATCH /profile` | Bearer |
| Meals | `GET /meals`, `POST /meals`, `GET/DELETE/PATCH /meals/[id]` | Bearer |
| Activities | `GET /activities`, `POST /activities`, `DELETE /activities/[id]` | Bearer |
| Sleep | `GET /sleep`, `POST /sleep` (upsert) | Bearer |
| Water | `GET /water`, `POST /water` (upsert), `GET /water/today` | Bearer |
| Stats | `GET /stats` | Bearer |
| Export | `GET /export` (JSON download) | Bearer |
| AI | `GET /ai/health`, `POST /ai/predict` (multipart image) | Public proxy |
| Admin | `GET /admin/stats`, `GET /admin/users`, `GET /admin/users/[id]` | Bearer + `ADMIN` role |

### 6.2 Authentication Flow

1. User submits credentials → `POST /api/auth/login` (or `/signup`)
2. Password is verified against the bcrypt hash (cost 12)
3. Server returns `{ user, token }` where token is a **JWT signed with `jose` (HS256, `sub` = userId, 7-day expiry)**
4. Client keeps the token in `sessionStorage` and sends `Authorization: Bearer <token>`
5. Each protected handler calls `requireUser(req)`, which verifies the token and resolves the user
6. Admin endpoints additionally assert `user.role === "ADMIN"`
7. `sanitize()` strips `passwordHash` from every user object in responses

### 6.3 Validation

Zod schemas in `lib/validators/` are **shared between client forms and server handlers**. `parseBody`/`parseQuery` helpers reject invalid requests with `400 VALIDATION_ERROR` before any business logic runs. Rules cover e.g. email format, password minimum length, meal type enums, date formats (`YYYY-MM-DD`), and numeric ranges.

### 6.4 Business Rules

- Users can only access their own data — every query is scoped to `userId` from the JWT
- One water/sleep record per user per date (upsert); multiple activities per day allowed
- Meal create/delete automatically recomputes `UserStats` (totals, average daily calories, favorite food, streaks, achievements) inside the service layer
- Streaks = consecutive dates with at least one logged meal; achievement rules are defined in the backend
- Weight changes via `PATCH /users/me` create a `BMIHistory` record

---

## 7. AI / ML Model

### 7.1 Problem & Data

The model answers: *"Which Nigerian swallow is in this photo?"* — classifying a food image into one of **4 classes: Amala, Eba, Pounded Yam, Semo**.

The dataset was organized as `dataset/{train,val,test}/{class}/` via a local `split_dataset.py` script, zipped, uploaded to Google Colab, and loaded with `torchvision.datasets.ImageFolder`.

### 7.2 Architecture & Training

| Attribute | Detail |
|---|---|
| Framework | PyTorch, trained in **Google Colab** |
| Base model | **EfficientNet-B0** pretrained on ImageNet |
| Transfer learning | Feature-extractor layers frozen; only the final classifier head trained |
| Input | 224×224×3 RGB |
| Preprocessing | Resize (224, 224) → ToTensor → ImageNet normalization (`mean=[0.485, 0.456, 0.406]`, `std=[0.229, 0.224, 0.225]`) |
| Augmentation (train only) | RandomHorizontalFlip, RandomRotation(20°), ColorJitter |
| Optimizer | Adam, learning rate **0.001**, applied to classifier head only |
| Epochs | **15** (configurable) |
| Evaluation | Per-epoch train/val loss + accuracy curves; final test-set evaluation; confusion matrix + sample predictions saved |
| Weights | `food_classifier.pth` — PyTorch state_dict, **16.3 MB** |
| Labels | `class_names.json` maps output index → class name |

Two training runs exist in the repo: a 3-class run (Amala, Eba, Semo) and the canonical **4-class "Second run"** used in production. The 3-class model is retained as an archive.

### 7.3 Inference Service (`model-service/`)

A FastAPI service loads the model once at startup (lifespan handler, ~5-10 s cold start) and keeps it in memory:

```
POST /predict  (multipart: file ≤ 10 MB, JPEG/PNG/WebP)
  1. Decode bytes → PIL Image → convert RGB
  2. Apply the exact training preprocessing transform → tensor [1,3,224,224]
  3. model.eval() + torch.no_grad() forward pass
  4. Softmax → per-class probabilities
  5. Sort by confidence → top-N predictions + inference time
```

Response shape:

```json
{
  "predictions": [
    { "class_name": "Amala", "confidence": 0.6466 },
    { "class_name": "Eba", "confidence": 0.3050 }
  ],
  "top_prediction": { "class_name": "Amala", "confidence": 0.6466 },
  "inference_time_ms": 281.74
}
```

- Runs on **CPU** (no GPU required); inference is ~30-280 ms per image
- `GET /health` reports `model_loaded`, model name, and class list (used for health checks and readiness)
- Two-layer validation: the Next.js proxy checks file presence/type/size first; the model service validates again (defense in depth)

### 7.4 End-to-End Prediction Flow

```
Browser (AI Food Scanner)
  → POST /api/ai/predict  (multipart image, same-origin)
    → Next.js Route Handler: validate file (type/size/presence)
      → model-client → POST http://model-service:3002/predict
        → FastAPI: preprocess → EfficientNet-B0 forward → softmax
      ← predictions JSON
    → Next.js returns structured predictions (maps model errors to 502/504)
  → Browser renders confidence bars, highlights top match
    → optional "Log as Meal" — saves the predicted food as a meal
```

---

## 8. Deployment & DevOps

### 8.1 Docker Compose (4 services)

| Service | Build | Port | Health check |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 (host, for tooling) | `pg_isready` |
| `migrate` | multi-stage Node image (`target: migrate`) | — | runs `scripts/migrate.sh` (migrate + seed) to completion |
| `model-service` | PyTorch base image + FastAPI | internal :3002 | `curl /health` |
| `next-app` | multi-stage Node (`deps → builder → runner`) | 3000 | `curl /api/health` |

**Startup ordering:** postgres healthy → migrate runs (migrations + seed) → next-app waits for migrate to complete → model-service loads weights. Data persists in the named volume `pgdata`.

**Key features:**

- Multi-stage `Dockerfile`: installs only production deps into the final `runner` stage, uses Next.js `output: "standalone"` for a minimal image, runs as a non-root `nextjs` user
- Memory limits and reservations on every container (model service capped at 2 GB)
- `.dockerignore` excludes `node_modules`, `.next`, `.git`, model venvs
- `PrismaPg` driver adapter (Prisma 7) with `binaryTargets` configured for OpenSSL 3.0 compatibility

### 8.2 Production Hosting (VPS + Docker Compose)

A regular VPS runs the full stack via `docker-compose.yml`:

- **`caddy`** — reverse proxy with automatic Let's Encrypt TLS for `gluguide.com`
- **`next-app`** — the Next.js app (health check `/api/health`)
- **`model-service`** — the model service (internal-only, health check `/health`)
- **`postgres`** — self-hosted PostgreSQL 16 with a persistent volume

GitHub Actions (`deploy.yml`) builds both images on push to `main`, pushes them to GHCR tagged with the git SHA, then SSHes into the VPS to pull and restart the stack. Secrets (DB password, JWT secret) live in a `.env` on the VPS, not in the repo. Backups run via `scripts/backup-db.sh` (cron `pg_dump`).

### 8.3 Verification Toolchain

Every phase was validated with the same commands:

```bash
npm run build     # production build (types + ESLint run during build)
npm run lint      # ESLint
npx tsc --noEmit  # strict typecheck
docker compose up --build   # full local system
```

---

## 9. Security Measures

| Threat | Mitigation |
|---|---|
| Plaintext password storage | bcrypt hashing (cost factor 12) via `bcryptjs` — legacy plaintext storage removed |
| Unauthorized access | Stateless JWT (HS256, `sub` = userId, 7-day expiry) verified by `requireUser()` on every protected route |
| Privilege escalation | Role check (`user.role === "ADMIN"`) on all admin routes |
| Data leakage between users | Every query scoped to the JWT `userId`; ownership checks on per-resource routes (meals, activities) |
| Leaked password hashes in API responses | `sanitize()` strips `passwordHash` from all serialized users |
| Malformed / hostile input | Zod validation server-side before any logic; shared schemas keep client and server in sync |
| Malicious file uploads | Size limit (10 MB) and format whitelist (JPEG/PNG/WebP) at the Next.js proxy, re-validated at the model service |
| Abusing free-tier hosting | Container-level memory limits and health-gated startup |

**Known hardening backlog:** rate limiting on auth endpoints, JWT stored in httpOnly cookies (CSRF protection), and automated test coverage are identified as future work.

---

## 10. Testing & Validation Approach

The project has no formal unit/integration test suite — **validation was done through phase-completion checks** and manual end-to-end flows. Every phase report records:

- **Build/lint/typecheck results** (`npm run build`, `npm run lint`, `npx tsc --noEmit`)
- **API-level smoke tests** with `curl` / Postman (each endpoint's success + error paths)
- **Manual UI walkthroughs** (auth → meal logging → water → sleep → AI scan → admin)
- **Container-level tests** inside Docker (migrations apply, seed is idempotent, health endpoints respond, data survives `docker compose down`)

### 10.1 Representative Validation Results

| Check | Result |
|---|---|
| `POST /api/auth/signup` | 201, creates user + profile + stats, returns user + JWT (no hash) |
| `POST /api/auth/login` | 200 with JWT; invalid credentials → 401 |
| `GET /api/auth/me` without token | 401 UNAUTHORIZED |
| `POST /api/meals` | 201, meal + foods + `totalNutrition`, stats recomputed |
| `POST /api/water` / `POST /api/sleep` | upsert pattern verified |
| Model service `/predict` with apple image | 200, `top_prediction: Amala (0.65)` |
| Invalid image format | 400 `Unsupported image format` |
| Oversized upload | 413 |
| Model offline | 502 `MODEL_UNAVAILABLE` |
| Seed re-run | idempotent, no duplicates |
| Data persistence | survives container recreation (named volume) |

---

## 11. Results, Limitations & Future Work

### 11.1 What Was Achieved

- A full-stack, database-backed nutrition tracker (replacing a localStorage prototype) with zero remaining legacy data-layer code
- A working deep-learning food classifier, containerized as a microservice and integrated end-to-end
- A one-command local deployment (`docker compose up --build`) and a live cloud deployment on Render
- A layered, validated architecture (Route Handler → Service → Repository → Prisma) with uniform response/error contracts
- Documented, phased development history — the repo itself is the engineering record for the defense

### 11.2 Known Limitations

- **4-class classifier scope** — the model only identifies Amala, Eba, Pounded Yam, and Semo; other Nigerian foods require manual logging
- **Confidence caveats** — the classifier can mislabel visually similar foods; the UI surfaces confidence scores and warns on low-confidence predictions
- **No automated test suite** — testing is manual/phase-based
- **No rate limiting** on public auth endpoints
- **Token in memory/sessionStorage** rather than httpOnly cookies
- **Prediction persistence** (`FoodPrediction` table) is defined in the schema but not yet written by the predict route

### 11.3 Future Work

- Expand the dataset and class list (more foods, more images per class, improved augmentation)
- Retrain with learning-rate scheduling and early stopping for higher accuracy
- Automated tests (Vitest + Playwright) and CI/CD (GitHub Actions: lint → test → build → deploy)
- Rate limiting, httpOnly-cookie sessions, and prediction-history UI
- Mobile app or PWA wrapper
- Food-portion estimation from images (quantify calories from a photo, not just identity)

---

*Compiled from the repository's source code, design documents (`docs/`), phase completion reports, and the training notebook. See `docs/defense-prep.md` for presentation guidance and anticipated defense questions.*
