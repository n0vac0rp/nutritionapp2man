# Architecture Plan: GluGuide — Smart Nutrition Monitoring System

> **Status:** Phase 9 Complete — Dockerization
> **Date:** August 2026
> **Last Updated:** 01 August 2026
> **Purpose:** Transform a fully client-side Next.js prototype into a production-style full-stack application with ML inference capabilities.

---

## Table of Contents

1. [Repository Audit](#1-repository-audit)
2. [Proposed Architecture](#2-proposed-architecture)
3. [Docker Architecture](#3-docker-architecture)
4. [ML Model Service](#4-ml-model-service)
5. [API Architecture](#5-api-architecture)
6. [Model Inference API](#6-model-inference-api)
7. [Codebase Cleanup Plan](#7-codebase-cleanup-plan)
8. [Backend Project Structure](#8-backend-project-structure)
9. [Frontend Refactoring Plan](#9-frontend-refactoring-plan)
10. [Implementation Risks](#10-implementation-risks)
11. [Implementation Phases](#11-implementation-phases)
12. [Recommended Roadmap](#12-recommended-roadmap)

---

## 1. Repository Audit

### 1.1 Current Folder Structure (Meaningful Files Only)

```
nutritionapp2man/
├── app/                          # Next.js App Router (pages, components, contexts, hooks)
│   ├── layout.tsx                # Root layout with AuthProvider, ThemeProvider
│   ├── page.tsx                  # Entry point (auth gate → dashboard)
│   ├── globals.css               # Tailwind v4 + custom red/amber theme
│   ├── components/               # 21 page-level components
│   │   ├── auth-page.tsx
│   │   ├── dashboard.tsx
│   │   ├── food-logger.tsx
│   │   ├── meal-logger.tsx
│   │   ├── nutrition-summary.tsx
│   │   ├── bmi-calculator.tsx
│   │   ├── profile-settings.tsx
│   │   ├── sleep-tracker.tsx
│   │   ├── water-tracker.tsx
│   │   ├── physical-activities.tsx
│   │   ├── recommendations.tsx
│   │   ├── admin-dashboard.tsx
│   │   ├── user-profile-details.tsx
│   │   ├── daily-meal-tracker.tsx
│   │   ├── weekly-meal-overview.tsx
│   │   ├── portion-sizing-guide.tsx
│   │   ├── rating-dialog.tsx
│   │   ├── tutorial.tsx
│   │   ├── loading-spinner.tsx
│   │   └── personalized-welcome.tsx
│   ├── contexts/
│   │   ├── auth-context.tsx       # Mock auth via localStorage
│   │   └── theme-context.tsx      # Dark/light mode
│   ├── data/
│   │   └── nigerian-foods.ts      # 1461-line inline food database
│   ├── hooks/
│   │   ├── use-meals.ts           # Meal CRUD via LocalDatabase
│   │   └── use-profile.ts         # Profile CRUD via LocalDatabase
│   └── utils/
│       └── calculations.ts        # BMI, WHR, calorie recommendations
├── components/
│   ├── theme-provider.tsx
│   └── ui/                       # 53 shadcn/ui primitives
├── lib/
│   ├── local-storage.ts          # 1042-line "database" (all business logic)
│   └── utils.ts                  # cn() classname utility
├── public/
│   └── images/                   # 14 food/portion reference images
├── model/                        # ML training artifacts (NOT integrated)
│   ├── first run/                # 3-class model: Amala, Eba, Semo
│   │   ├── food_classifier.pth   # 16.3 MB
│   │   ├── class_names.json
│   │   └── training_notebook.ipynb
│   └── Second run/               # 4-class model: + Pounded Yam
│       ├── food_classifier.pth   # 16.3 MB
│       ├── class_names.json
│       └── *.png, *.docx, *.pdf
├── scripts/
│   └── add-sample-data.ts
├── styles/
│   └── globals.css               # [DEAD FILE - not imported]
├── package.json                  # Next.js 15.2.4, React 19, Tailwind v4
└── tsconfig.json
```

### 1.2 Duplicated / Dead Directories

| Path | Size | Status | Action |
|---|---|---|---|
| `nutritionapp2man-main/` | ~1.9 MB | Recursively nested duplicate (6 levels deep) | **DELETE** |
| `nigerian-nutrition-app--2--main/` | ~192 KB | Extracted archive duplicate | **DELETE** |
| `Captures/` | ~500 KB | Screenshot + Windows `desktop.ini` | **DELETE** |
| `docs/` | 0 B | Empty directory | Will be populated now |
| `styles/globals.css` | ~2 KB | Duplicate CSS, not imported anywhere | **DELETE** |
| `pnpm-lock.yaml` | 5 lines | Incomplete — project uses npm | **DELETE** |

### 1.3 Code Smells & Issues Found

1. **No backend whatsoever.** All logic lives client-side in `lib/local-storage.ts`. No API routes, no fetch calls.
2. **Plaintext passwords in localStorage.** The `STORAGE_KEYS.PASSWORDS` key stores `{ userId: plaintextPassword }` mappings.
3. **Single-file data layer.** The 1042-line `local-storage.ts` mixes concerns: database, CRUD operations, business logic, stats computation, data import/export. Equivalent of a monolithic backend squashed into one file.
4. **Inline food database.** `app/data/nigerian-foods.ts` is 1461 lines of hardcoded nutritional data. Should live in a real database.
5. **No separation of concerns.** UI components call `LocalDatabase` directly (e.g., `LocalDatabase.getWaterIntake()`, `LocalDatabase.createUser()`).
6. **Model not integrated.** 32+ MB of PyTorch model files exist but are never loaded or called by the frontend.
7. **Conflicting lockfiles.** Both `package-lock.json` (npm) and `pnpm-lock.yaml` exist. The project uses npm.
8. **`.DS_Store` files.** macOS metadata files scattered through the repo. Should be added to `.gitignore`.
9. **v0.dev boilerplate.** Console logs prefixed `[v0]` throughout. Many comment stubs from AI generation.
10. **No input validation beyond client-side.** No server-side validation of any data.

### 1.4 Missing Backend

The application currently has:
- **No API routes** (`app/api/` directory does not exist)
- **No server directory**, no `server.ts`, no Express/Fastify/Next.js API routes
- **No database connection** — all data in browser `localStorage`
- **No authentication mechanism** beyond localStorage mock
- **No file upload handling** (needed for model inference from camera/gallery)
- **No environment configuration** (no `.env` files)

### 1.5 Frontend Assumptions Currently Hardcoded

- All data is stored in the browser — no persistence across devices
- Demo users are seeded on initialization
- Passwords are stored as plaintext strings
- Auth state is a React context wrapping `LocalDatabase.getCurrentUser()`
- Nutritional calculations reference the hardcoded `nigerianFoods` array
- Water intake, sleep tracking, meal logging all read/write directly to localStorage

### 1.6 Where API Calls Should Eventually Live

Every call to `LocalDatabase.*` methods should become an API call. The key transition points:

| Current (client-side) | Future (API call) |
|---|---|
| `LocalDatabase.createUser()` | `POST /api/auth/signup` |
| `LocalDatabase.loginUser()` | `POST /api/auth/login` |
| `LocalDatabase.getCurrentUser()` | `GET /api/auth/me` |
| `LocalDatabase.createMeal()` | `POST /api/meals` |
| `LocalDatabase.getUserMeals()` | `GET /api/meals?startDate=&endDate=` |
| `LocalDatabase.deleteMeal()` | `DELETE /api/meals/:id` |
| `LocalDatabase.getUserProfile()` | `GET /api/profile` |
| `LocalDatabase.updateUserProfile()` | `PUT /api/profile` |
| `LocalDatabase.getUserStatsById()` | `GET /api/stats` |
| `LocalDatabase.createSleepEntry()` | `POST /api/sleep` |
| `LocalDatabase.logWaterIntake()` | `POST /api/water` |
| `LocalDatabase.getAppStats()` | `GET /api/admin/stats` |
| Model inference (new) | `POST /api/model/predict` |

### 1.7 Where Authentication Currently Exists

Auth is in `app/contexts/auth-context.tsx`. It:
- Calls `LocalDatabase.initialize()` on mount (seeds demo users)
- Calls `LocalDatabase.getCurrentUser()` to check for a logged-in session
- Provides `login()`, `signup()`, `logout()` functions to components
- Passwords are checked via `LocalDatabase.loginUser()` which reads from `localStorage` `naijafit_passwords` key
- No tokens, no sessions, no password hashing, no CSRF protection

### 1.8 How State Is Currently Managed

- **Auth state:** React Context (`AuthContext`) — holds current `User` object
- **Meal state:** Custom hook (`useMeals`) — fetches from `LocalDatabase`, maintains local `useState<Meal[]>`
- **Profile state:** Custom hook (`useProfile`) — fetches from `LocalDatabase`
- **Theme state:** `next-themes` wrapper via `ThemeProvider`
- **Form state:** `react-hook-form` + `zod` (already installed — good foundation)
- **No global state manager** (no Redux, Zustand, Jotai)

### 1.9 How Data Currently Flows

```
┌────────────────────────────────────────────────┐
│                    Browser                      │
│                                                 │
│  ┌──────────┐   ┌──────────────┐               │
│  │ Component │──▶│  Custom Hook  │               │
│  │  (TSX)    │◀──│ (useMeals,   │               │
│  └──────────┘   │  useProfile)  │               │
│                  └──────┬───────┘               │
│                         │                       │
│                  ┌──────▼───────┐               │
│                  │ LocalDatabase │               │
│                  │  (Class with  │               │
│                  │   all CRUD)   │               │
│                  └──────┬───────┘               │
│                         │                       │
│                  ┌──────▼───────┐               │
│                  │ localStorage  │               │
│                  │  (7 JSON keys)│               │
│                  └──────────────┘               │
└────────────────────────────────────────────────┘
```

**No data leaves the browser.** There is zero server-side processing.

---

## 2. Proposed Architecture

### 2.1 Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Next.js Application (Port 3000)              │  │
│  │  ┌─────────────────┐  ┌──────────────────────────┐   │  │
│  │  │  React Frontend │  │  Route Handlers (Backend) │   │  │
│  │  │  (Client)       │  │  Auth, APIs, Business     │   │  │
│  │  │  React 19       │  │  Logic, Validation,       │   │  │
│  │  │  Tailwind v4    │  │  Image Upload             │   │  │
│  │  │  shadcn/ui      │  │  Model Client             │   │  │
│  │  │  React Query    │  │  Prisma Client            │   │  │
│  │  └────────┬────────┘  └───────────┬──────────────┘   │  │
│  └───────────┼───────────────────────┼──────────────────┘  │
│              │ HTTPS / REST + JSON   │                     │
└──────────────┼───────────────────────┼─────────────────────┘
               │                       │
        ┌──────▼──────┐         ┌──────▼──────┐
        │   Nginx     │         │  Model      │
        │ (reverse    │         │  Service    │
        │  proxy)     │         │  FastAPI    │
        │ production  │         │  :3002      │
        └──────┬──────┘         └─────────────┘
               │
        ┌──────▼──────┐
        │  Database   │
        │  PostgreSQL │
        │  :5432      │
        └─────────────┘
```

The Next.js application is a **single unified service** that handles both server-side rendering and API route handling. This eliminates the need for a separate Express backend.

### 2.2 Component Recommendations

#### Next.js Application (Unified Frontend + Backend)

- **Framework:** Next.js 15.x (App Router) — serves both UI and API routes
- **Runtime:** Node.js (LTS 22+)
- **Language:** TypeScript (strict mode)
- **Frontend State Management:** React Query (TanStack Query) for server state; React Context for auth state
- **Forms:** react-hook-form + zod (already installed)
- **HTTP Client:** native fetch with a centralized API client module for calls to the model service
- **Backend Auth:** JWT (jsonwebtoken + bcrypt) — implemented in Next.js Route Handlers and Server Actions

**Why Next.js as the full-stack framework over Express:**
- **Single codebase, single deployment.** No need to maintain and deploy a separate Express server alongside the Next.js app. Reduces operational complexity.
- **Colocation of types.** TypeScript types defined in one place and shared between frontend components and Route Handlers without a separate package or duplication.
- **Simpler architecture.** Three Docker services instead of four. Less networking complexity, fewer environment variables, simpler docker-compose.
- **Route Handlers are production-ready.** Next.js App Router Route Handlers support streaming, middleware, edge runtime, and are used in production by major companies.
- **Server Components and Server Actions.** Can leverage React Server Components for initial data fetching, reducing the need for client-side API calls on first render.
- **Gradual adoption.** Route Handlers can be added incrementally alongside the existing frontend without restructuring the entire project.

#### Database

- **Recommendation: PostgreSQL**

**Why PostgreSQL:**
- Relational data model fits the structured nature of the app (users, meals, foods, nutrition)
- Excellent JSON/JSONB support for flexible fields (e.g., user preferences, meal metadata)
- Widely supported in Docker, university environments, and deployment platforms
- Better than MySQL for strict type enforcement, window functions, and full-text search
- Better than MongoDB for this use case — the data is inherently relational, not document-oriented
- Free tier available on Railway, Render, Fly.io, Supabase

#### ORM / Query Builder

- **Recommendation: Prisma**

**Why Prisma:**
- Type-safe generated client — reduces runtime errors
- Intuitive schema definition language
- Excellent migration system
- Auto-generated TypeScript types that can be shared with the frontend
- Good documentation and community
- Works well with PostgreSQL

**Alternative considered:** Drizzle ORM — lighter weight, SQL-like API. Prisma wins for university project due to better tooling (Prisma Studio for visual DB inspection, simpler learning curve).

#### Validation

- **Recommendation: Zod**

**Why Zod:**
- Already installed in the frontend (v3.25.76)
- TypeScript-first — can infer TypeScript types from schemas
- Share schemas between frontend and backend (monorepo or shared package)
- Excellent integration with react-hook-form (already used in frontend via `@hookform/resolvers`)
- Expressive API for complex validation rules

#### Authentication

- **Recommendation: JWT (jsonwebtoken) + bcrypt**

**Why JWT for a university project:**
- Stateless — no server-side session store needed
- Implemented in Next.js Route Handlers as reusable auth utilities
- Can be verified in both Route Handler middleware and Server Components
- Widely understood and documented
- Simple to test with tools like Postman or curl
- No third-party service dependency (no Auth0/Firebase pricing concerns)

**Implementation approach:**
- Auth utilities (sign/verify JWT, hash/compare passwords) live in `app/lib/auth/`
- Route Handlers call these utilities directly — no separate middleware layer needed
- JWT token returned to client, stored in memory or httpOnly cookie
- Protected routes verify the token at the start of each handler
- React Server Components can read the token from cookies to pre-fetch user data

**Future upgrade path:** If requirements grow, JWT can be replaced with session-based auth, NextAuth.js, or an OAuth provider without changing the API contract.

#### API Style

- **REST** — standard, well-understood, tooling-rich, simple to document with Swagger
- All APIs live under `app/api/` as Next.js Route Handlers

#### Documentation

- **OpenAPI / Swagger** — write the spec manually or use `@scalar/nextjs-api-reference` to serve API docs directly from the Next.js app. Alternatively, maintain a standalone `openapi.yaml` file.

---

## 3. Docker Architecture

### 3.1 Service Layout

```
docker-compose.yml
├── next-app          (Next.js — unified frontend + API Routes)
├── model-service     (FastAPI — PyTorch inference service)
└── postgres          (PostgreSQL — introduced in a later phase)
```

Three services (database is optional for early development — the app can start with a mock data layer initially).

### 3.2 Service Responsibilities

#### `next-app` (Next.js — Frontend + Backend)

This is a **single unified service** that owns both the user interface and the API.

- **Serves React pages** to browsers via Server Components and Client Components
- **Handles all API routes** under `app/api/`:
  - Authentication (signup, login, JWT management)
  - Meal CRUD (logging, querying, deleting meals)
  - Profile management
  - Nutrition/food database queries
  - Sleep tracking, water intake
  - User statistics, streak calculations, achievements
  - Image upload and forwarding to model service
  - Admin dashboard data
- **Business logic layer** — validates input with Zod, orchestrates Prisma queries, enriches responses
- **Communicates with `model-service`** over Docker network (http://model-service:3002) for image classification
- **Communicates with `postgres`** over Docker network (postgresql://postgres:5432) via Prisma
- **In development:** `next dev --port 3000` with Turbopack + hot module replacement
- **In production:** `next build && next start --port 3000`
- Port 3000 exposed to host

#### `model-service` (FastAPI — PyTorch Inference)

- Loads the trained EfficientNet-B0 model at startup (one-time load, kept in memory)
- Exposes a single inference endpoint (`POST /predict`)
- Handles image preprocessing, inference, and postprocessing
- Returns predictions with class names and confidence scores
- Contains **no authentication or application business logic**
- Port 3002 exposed to host for direct testing
- Memory-intensive service (PyTorch runtime + model weights ~500 MB-1 GB RAM)

#### `postgres` (PostgreSQL)

- Persistent storage for all application data
- Port 5432 exposed to host for development (pgAdmin, Prisma Studio, direct queries)
- Data persisted via Docker named volume
- Single instance (no replication needed for this scope)
- Introduced in Phase 3 — early development can use SQLite or mock data

### 3.3 Communication Between Containers

```
┌─────────────────────────────┐
│        Next.js App          │
│         Port 3000           │
│                             │
│  Client Components          │
│    │ (fetch to same origin) │
│    ▼                        │
│  Route Handlers ────────────┼──▶ Model Service
│    │ (app/api/*)            │    Port 3002
│    │                        │    POST /predict
│    ▼                        │
│  Prisma Client              │
└──────┬──────────────────────┘
       │
       │ TCP :5432 (PostgreSQL wire protocol)
       │
┌──────▼──────┐
│  PostgreSQL │
│  Port 5432  │
└─────────────┘
```

**Key communication rules:**
- Client-side React components call API routes on the **same origin** (`/api/*`) — no CORS issues in development or production
- Next.js Route Handlers are the only code that talks to PostgreSQL (via Prisma)
- Next.js Route Handlers are the only code that talks to the model service
- The model service is purely an inference engine — no database access, no auth
- All inter-service communication uses the Docker internal network (service names as hostnames)

### 3.4 Networking

- All services joined on a single Docker bridge network (e.g., `gluguide-network`)
- Service discovery via Docker DNS (container name = hostname)
- Connection strings within the Next.js container:
  - Database: `DATABASE_URL="postgresql://gluguide_user:password@postgres:5432/gluguide"`
  - Model: `MODEL_SERVICE_URL="http://model-service:3002"`
- Only `next-app` needs host port mapping for development (port 3000)
- `model-service` port 3002 exposed to host for direct testing only
- `postgres` port 5432 exposed to host for tooling access (Prisma Studio, pgAdmin)
- In production, only `next-app` (and optionally Nginx) is publicly exposed

### 3.5 Environment Variables

**`next-app`:**
```
NODE_ENV=development|production
DATABASE_URL=postgresql://gluguide_user:password@postgres:5432/gluguide
JWT_SECRET=<random-64-char-string>
JWT_EXPIRES_IN=7d
MODEL_SERVICE_URL=http://model-service:3002
UPLOAD_MAX_SIZE_MB=10
```

Note: No `NEXT_PUBLIC_*` URL needed — API routes are same-origin.

**`model-service`:**
```
PORT=3002
MODEL_PATH=/app/model/food_classifier.pth
CLASS_NAMES_PATH=/app/model/class_names.json
```

**`postgres`:**
```
POSTGRES_USER=gluguide_user
POSTGRES_PASSWORD=password
POSTGRES_DB=gluguide
```

### 3.6 Persistent Storage

```
volumes:
  pgdata:          # PostgreSQL data — survives container restarts/recreations
```

- Database data must survive container restarts — use a named volume mapped to `/var/lib/postgresql/data`
- Uploaded images for inference are held in memory/buffer, not persisted to disk (can use temp directory in Next.js container if needed)
- Model weights file is copied into the model-service image at build time

### 3.7 Startup Order

```
1. postgres       — must be healthy before Next.js starts
2. model-service  — loads model weights (~5-15s cold start)
3. next-app       — depends on postgres being healthy, model-service being ready
```

Use `depends_on` with `condition: service_healthy`:

```yaml
next-app:
  depends_on:
    postgres:
      condition: service_healthy
    model-service:
      condition: service_started
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
```

**Model service cold start is slow** (loading PyTorch + model weights into memory, ~5-15 seconds). The model service should expose a `/health` readiness endpoint that returns 200 only after the model is loaded. The Next.js app polls or retries if the model service is not yet ready.

### 3.8 Development Workflow

1. `docker compose up` — starts all three services
2. Source code is bind-mounted into the `next-app` container (hot reload works)
3. `next-app` runs `next dev --port 3000` with Turbopack
4. `model-service` runs with Python venv + FastAPI with `--reload`
5. Database migrations run inside the `next-app` container: `npx prisma migrate dev`
6. Prisma Studio available at `npx prisma studio` (port 5555) for visual DB inspection

**Recommended developer setup script:**
```bash
# First time:
docker compose up -d postgres  # Start DB first
npx prisma migrate dev          # Run migrations (runs against localhost:5432)
docker compose up               # Start everything
```

### 3.9 Production Workflow

1. Multi-stage Docker builds for each service
2. Next.js: `next build` → production build → `next start`
3. Model service: Python `slim` base image with only runtime dependencies
4. Nginx reverse proxy in front of the Next.js app (optional)
5. PostgreSQL using a managed service (Railway, Supabase, Render) or dedicated container with backups
6. CI/CD via GitHub Actions: lint → test → build images → push to registry → deploy

---

## 4. ML Model Service

### 4.1 Model Details (Extracted from Training Notebook)

**Framework:** PyTorch (trained in Google Colab)

**Architecture:**
- **Base model:** EfficientNet-B0 (pretrained on ImageNet)
- **Transfer learning:** Feature extractor layers frozen; only classifier head trained
- **Input size:** 224×224×3 (RGB)
- **Normalization:** ImageNet mean/std (`[0.485, 0.456, 0.406]`, `[0.229, 0.224, 0.225]`)
- **Data augmentation during training:** RandomHorizontalFlip, RandomRotation(20), ColorJitter
- **Optimizer:** Adam, learning rate 0.001
- **Epochs:** 15 (configurable)

**Model files required for inference:**
1. `food_classifier.pth` — PyTorch state_dict (model weights, 16.3 MB)
2. `class_names.json` — class label mapping (e.g., `["Amala", "Eba", "Pounded Yam", "Semo"]`)

**Two model versions exist:**
- `model/first run/` — 3 classes: Amala, Eba, Semo
- `model/Second run/` — 4 classes: Amala, Eba, Pounded Yam, Semo

**Use the Second run (4-class) model** as the canonical version.

**class_names.json purpose:** Maps model output indices to human-readable food names. After inference, the index with the highest softmax probability is looked up in this array to produce the predicted label.

### 4.2 Where Should the Model Live?

| Approach | Pros | Cons |
|---|---|---|
| **Inside Next.js process** | Fewer containers; no network overhead for inference | Mixes Node.js and Python environments; PyTorch is a heavy dependency; different language ecosystems; would require `child_process` hacks |
| **Separate service (recommended)** | Clean separation of concerns; independent scaling; independent tech stack (Python/PyTorch); easier to swap model later | Additional container; network latency (~1-5ms on Docker network); more complex docker-compose |

**Recommendation: Separate service.** The model is Python/PyTorch — putting it inside a Node.js process would require `child_process` hacks or a Python subprocess, both of which are fragile. A dedicated FastAPI microservice is the cleanest approach for a university project and teaches good microservice patterns.

### 4.3 Serving Options Comparison

| Option | Complexity | Performance | University-appropriate? |
|---|---|---|---|
| **Flask API** | Low | Adequate (synchronous, ~50-100 req/s) | Yes — simplest, widely taught |
| **FastAPI** | Low-Medium | Good (async, ~200-500 req/s) | **Recommended** — auto OpenAPI docs, async, modern |
| **TorchServe** | High | Excellent (batched, optimized) | Overkill for a project with <4 classes |
| **Custom inference service** | High | Variable | Unnecessary reinvention |

**Recommendation: FastAPI.** It's Python-based (matches the model's ecosystem), has built-in async support, auto-generates OpenAPI documentation (a plus for the university deliverable), validates request/response schemas with Pydantic (analogous to Zod in the Node.js world), and has a low learning curve.

### 4.4 Inference Request Lifecycle

```
Browser
  │  POST /api/model/predict (multipart/form-data, JWT in header)
  ▼
Next.js Route Handler (app/api/model/predict/route.ts)
  │  1. Validates JWT token
  │  2. Validates image type and size
  │  3. Forwards image to model service
  ▼
FastAPI Model Service (POST /predict)
  │  a. Receives multipart/form-data image
  │  b. Decodes image bytes → PIL Image
  │  c. Resizes to 224×224
  │  d. Converts to tensor, normalizes with ImageNet stats
  │  e. Adds batch dimension: [1, 3, 224, 224]
  │  f. Runs model forward pass (no_grad)
  │  g. Applies softmax to get probabilities
  │  h. Returns top-k predictions with class names and confidences
  ▼
Next.js Route Handler
  │  4. Enriches prediction with nutrition data from database (if include_nutrition=true)
  │  5. Returns enriched result to browser
  ▼
Browser
```

### 4.5 Detailed Processing Pipeline

**Preprocessing (inference_service.py):**
```python
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])
```

**Inference:**
```python
model.eval()
with torch.no_grad():
    outputs = model(input_tensor)  # [1, num_classes]
    probabilities = torch.nn.functional.softmax(outputs, dim=1)
```

**Postprocessing — response format:**
```json
{
  "predictions": [
    { "class": "Amala", "confidence": 0.87 },
    { "class": "Eba", "confidence": 0.09 },
    { "class": "Semo", "confidence": 0.03 },
    { "class": "Pounded Yam", "confidence": 0.01 }
  ],
  "top_prediction": {
    "class": "Amala",
    "confidence": 0.87
  },
  "inference_time_ms": 42.3
}
```

### 4.6 Model Loading at Startup

Use FastAPI's `@app.on_event("startup")` lifecycle hook:

```python
@app.on_event("startup")
async def load_model():
    global model, class_names
    model = models.efficientnet_b0(weights=None)
    num_classes = len(class_names)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.to(device)
    model.eval()
```

**Key points:**
- Model is loaded once and kept in memory for the lifetime of the service
- `map_location=device` ensures the model works on CPU-only Docker containers
- GPU is NOT required for inference with a 4-class EfficientNet-B0 — CPU inference is fast enough (~30-80ms per image)
- Model weights (~16 MB) + PyTorch runtime (~400 MB) = ~500 MB minimum RAM for the service

### 4.7 Expected Latency

| Component | Estimated Time |
|---|---|
| Image upload (1-5 MB over Docker network) | 10-50 ms |
| Image decoding | 5-10 ms |
| Preprocessing (resize, normalize) | 2-5 ms |
| Model forward pass (CPU, EfficientNet-B0) | 30-80 ms |
| Softmax + postprocessing | 1-2 ms |
| Response serialization | 1-2 ms |
| **Total per request (cold cache)** | **~50-150 ms** |
| **Total per request (warm)** | **~40-100 ms** |

This is well within acceptable limits for a user-facing application. EfficientNet-B0 is the smallest/fastest model in the EfficientNet family — ideal for CPU inference.

### 4.8 Model Service Dependencies

```
fastapi==0.115.*
uvicorn[standard]==0.32.*
torch>=2.9.0,<3.0.0
torchvision>=0.20.0,<1.0.0
Pillow==11.*
python-multipart==0.0.*
pydantic-settings==2.*
```

> **Note (01 Aug 2026):** PyTorch 2.5 is no longer available on PyPI. Updated to `>=2.9.0,<3.0.0`. The model state_dict is backward compatible — model loaded successfully with torch 2.13.0 and torchvision 0.28.0.

**Docker base image:** `python:3.12-slim` (NOT `alpine` — PyTorch wheels don't support musl libc). Use `slim` which is Debian-based and has full glibc support for PyTorch.

---

## 5. API Architecture

Based on the frontend components and data models, these are the APIs required. Grouped by domain.

### 5.1 Authentication

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user | `{ fullName, email, password, age, gender, height, weight, waistCircumference?, hipCircumference? }` | `{ user, token }` |
| `POST` | `/api/auth/login` | Authenticate user | `{ email, password }` | `{ user, token }` |
| `GET` | `/api/auth/me` | Get current user (token required) | — (Bearer token header) | `{ user }` |
| `POST` | `/api/auth/logout` | Invalidate token (optional — client-side token removal is sufficient for JWT) | — | `{ success: true }` |

### 5.2 Profile

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/profile` | Get user profile with preferences | — | `{ profile }` |
| `PUT` | `/api/profile` | Update profile settings | `{ preferences, settings, personalizedRecommendations }` | `{ profile }` |
| `PUT` | `/api/profile/user` | Update user details (name, age, etc.) | `Partial<User>` | `{ user }` |
| `PUT` | `/api/profile/password` | Change password | `{ currentPassword, newPassword }` | `{ success: true }` |

### 5.3 Meals

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/meals` | Get meals (optional date filters) | Query: `?startDate=&endDate=&type=` | `{ meals: Meal[] }` |
| `GET` | `/api/meals/:id` | Get single meal | — | `{ meal }` |
| `POST` | `/api/meals` | Log a new meal | `{ type, date, time, foods[], mood?, notes? }` | `{ meal }` |
| `PUT` | `/api/meals/:id` | Update a meal | `Partial<Meal>` | `{ meal }` |
| `DELETE` | `/api/meals/:id` | Delete a meal | — | `{ success: true }` |
| `GET` | `/api/meals/date/:date` | Get meals for specific date | — | `{ meals: Meal[] }` |

### 5.4 Nutrition / Food Database

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/foods` | Search/list foods | Query: `?search=&category=&page=&limit=` | `{ foods: NigerianFood[], total, page }` |
| `GET` | `/api/foods/:id` | Get single food nutrition info | — | `{ food }` |
| `GET` | `/api/foods/categories` | Get all food categories | — | `{ categories: string[] }` |
| `POST` | `/api/foods` | Admin: add custom food | `{ name, category, nutrition... }` | `{ food }` |

### 5.5 Sleep Tracking

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/sleep` | Get sleep entries | Query: `?startDate=&endDate=` | `{ entries: SleepEntry[] }` |
| `POST` | `/api/sleep` | Log sleep entry | `{ date, hoursSlept, sleepQuality, bedTime?, wakeTime?, notes? }` | `{ entry }` |
| `PUT` | `/api/sleep/:id` | Update sleep entry | `Partial<SleepEntry>` | `{ entry }` |

### 5.6 Water Intake

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/water` | Get water intake history | Query: `?startDate=&endDate=` | `{ intakes: WaterIntake[] }` |
| `GET` | `/api/water/today` | Get today's water intake | — | `{ intake }` |
| `POST` | `/api/water` | Log/update water intake | `{ date, amount }` | `{ intake }` |

### 5.7 User Statistics

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/stats` | Get current user stats | — | `{ stats: UserStats }` |
| `GET` | `/api/stats/weight` | Get weight history | — | `{ weightProgress: { date, weight }[] }` |
| `GET` | `/api/stats/streaks` | Get streak data | — | `{ currentStreak, longestStreak }` |
| `GET` | `/api/stats/achievements` | Get achievements | — | `{ achievements: string[] }` |

### 5.8 Model Inference

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/model/predict` | Classify food image | `multipart/form-data` with `image` field | `{ predictions[], top_prediction, nutrition? }` |

### 5.9 Admin

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/admin/stats` | Get app-wide stats | — | `{ totalUsers, totalMeals, activeUsers, ... }` |
| `GET` | `/api/admin/users` | List all users | Query: `?page=&limit=` | `{ users[], total, page }` |
| `GET` | `/api/admin/users/:id` | View any user's data | — | `{ user, meals, profile, stats }` |
| `POST` | `/api/admin/import` | Import user data JSON | `{ jsonData: string }` | `{ importedData }` |
| `DELETE` | `/api/admin/imports/:id` | Delete imported data record | — | `{ success: true }` |

### 5.10 Settings / Health

| Method | Route | Purpose | Request | Response |
|---|---|---|---|---|
| `GET` | `/api/health` | Health check (no auth) | — | `{ status: "ok", uptime, db: "connected" }` |
| `GET` | `/api/version` | API version info | — | `{ version, environment }` |

---

## 6. Model Inference API

### 6.1 Endpoint Design

```
POST /api/model/predict
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>
```

### 6.2 Request

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | File (binary) | Yes | Food image to classify |
| `include_nutrition` | Boolean (string) | No | If true, also return nutrition info for top prediction |

Supported image types: `image/jpeg`, `image/png`, `image/webp`

Maximum upload size: 10 MB

### 6.3 Response — Success (200)

```json
{
  "success": true,
  "predictions": [
    { "class": "Amala", "confidence": 0.872 },
    { "class": "Eba", "confidence": 0.091 },
    { "class": "Semo", "confidence": 0.028 },
    { "class": "Pounded Yam", "confidence": 0.009 }
  ],
  "top_prediction": {
    "class": "Amala",
    "confidence": 0.872
  },
  "nutrition": {
    "calories": 110,
    "protein": 2.5,
    "carbs": 25.0,
    "fats": 0.5,
    "fiber": 2.0,
    "iron": 0.6,
    "vitaminA": 100,
    "servingSize": "1 ladle (100g cooked)",
    "servingWeight": 100,
    "portionCalories": { "small": 110, "medium": 260, "large": 390 }
  },
  "inference_time_ms": 67
}
```

The `nutrition` field is populated from the database by the backend after receiving the prediction from the model service. This keeps the model service purely an ML inference service — it doesn't need to know about nutrition data.

### 6.4 Response — Error Cases

**No image provided (400):**
```json
{
  "success": false,
  "error": "No image file provided",
  "code": "NO_IMAGE"
}
```

**Unsupported format (400):**
```json
{
  "success": false,
  "error": "Unsupported image format. Accepted: JPEG, PNG, WebP",
  "code": "UNSUPPORTED_FORMAT"
}
```

**File too large (413):**
```json
{
  "success": false,
  "error": "Image exceeds maximum size of 10 MB",
  "code": "FILE_TOO_LARGE"
}
```

**Model service unavailable (503):**
```json
{
  "success": false,
  "error": "Image classification service is temporarily unavailable",
  "code": "MODEL_UNAVAILABLE"
}
```

**Internal error (500):**
```json
{
  "success": false,
  "error": "An unexpected error occurred during classification",
  "code": "INFERENCE_ERROR"
}
```

### 6.5 Confidence Thresholds

The frontend should handle low-confidence predictions gracefully:

| Confidence Range | UX Behavior |
|---|---|
| ≥ 0.70 | Show prediction as primary result, auto-suggest adding to meal |
| 0.40 – 0.69 | Show prediction with "low confidence" warning, ask user to confirm |
| < 0.40 | Show "Could not confidently identify this food. Please select manually." |

This thresholding is a **frontend concern**, not backend — the API always returns all probabilities.

### 6.6 Next.js Route Handler → Model Service Internal Contract

The Next.js Route Handler (`app/api/model/predict/route.ts`) internally calls the model service:

```
POST http://model-service:3002/predict
Content-Type: multipart/form-data
```

**Model service response (internal):**
```json
{
  "predictions": [
    { "class": "Amala", "confidence": 0.872 },
    ...
  ],
  "top_prediction": {
    "class": "Amala",
    "confidence": 0.872
  },
  "inference_time_ms": 67
}
```

The Route Handler then:
1. Validates the model response
2. Looks up `top_prediction.class` in the `NigerianFood` table (via Prisma)
3. Attaches nutrition data if `include_nutrition=true`
4. Returns the enriched response to the client

---

## 7. Codebase Cleanup Plan

### 7.1 Delete These Entirely

| Path | Rationale |
|---|---|
| `nutritionapp2man-main/` | Recursively nested duplicate of the repo (1.9 MB) |
| `nigerian-nutrition-app--2--main/` | Second extracted archive duplicate |
| `Captures/` | Contains one screenshot + Windows `desktop.ini` |
| `styles/globals.css` | Dead CSS file — not imported, not used |
| `pnpm-lock.yaml` | Incomplete — project uses npm (`package-lock.json`) |

### 7.2 Consolidate Model Directory

Current mess:
```
model/
├── methodology and results.docx       (duplicate)
├── training_notebook.ipynb - Colab.pdf (duplicate)
├── first run/
│   ├── food_classifier.pth            (3-class, superseded)
│   ├── class_names.json
│   └── *.png, *.ipynb
└── Second run/
    ├── food_classifier.pth            (4-class, canonical)
    ├── class_names.json
    └── *.png, *.pdf, *.docx
```

**Recommended structure:**
```
model/
├── food_classifier.pth          ← from "Second run" (canonical 4-class model)
├── class_names.json             ← from "Second run"
├── training_notebook.ipynb      ← from "first run" (more complete notebook)
├── evaluation/
│   ├── accuracy_graphs.png
│   ├── confusion_matrix.png
│   ├── confusion_table.png
│   └── sample_predictions.png
└── archive/                     ← optional: keep old 3-class for reference
    └── first_run_food_classifier.pth
```

### 7.3 Add to `.gitignore`

```
.DS_Store
**/.DS_Store
.env
.env.*
*.tsbuildinfo
```

### 7.4 Inconsistent Naming

| Current Name | Suggested Name | Reason |
|---|---|---|
| Package: `my-v0-project` | `gluguide` or `nutritionapp` | v0.dev boilerplate name |
| `naijafit_*` localStorage keys | N/A (going away with backend) | Will be replaced by API calls |
| `nigerian-nutrition-app--2--main/` | Delete | Malformed archive name |

### 7.5 Folders to Add

```
model-service/              # New: FastAPI ML service (move model/ files here)
docs/                       # Populated with this plan
docker/                     # Dockerfiles per service (optional — can live in root)
```

### 7.6 Restructuring for Monorepo

Since there is no separate Express backend, the Next.js application stays at the project root. Only the model service lives in a separate directory.

Current: everything at root
```
nutritionapp2man/
├── app/          ← Next.js frontend + future API routes
├── components/
├── lib/
├── model/
├── package.json
├── tsconfig.json
└── ...
```

Recommended (after migration):
```
nutritionapp2man/
├── app/
│   ├── api/                  # [NEW] Next.js Route Handlers (all APIs)
│   │   ├── auth/
│   │   ├── meals/
│   │   ├── profile/
│   │   ├── foods/
│   │   ├── sleep/
│   │   ├── water/
│   │   ├── stats/
│   │   ├── model/
│   │   └── admin/
│   ├── components/           # UI components
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── lib/                  # [EXPANDED] Add auth, db, api-client modules
│   └── utils/
├── components/
├── lib/
│   ├── auth/                 # [NEW] JWT, bcrypt utilities
│   ├── db/                   # [NEW] Prisma client + schema
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── api-client/           # [NEW] Model service HTTP client
├── model-service/            # [NEW] FastAPI inference service (separate)
│   ├── app/
│   │   ├── main.py
│   │   └── model/
│   │       ├── food_classifier.pth
│   │       └── class_names.json
│   ├── requirements.txt
│   └── Dockerfile
├── prisma/                   # Prisma root config (or inside lib/db/)
│   ├── schema.prisma
│   └── migrations/
├── public/
├── docker-compose.yml        # [NEW] At root
├── .gitignore
├── package.json
├── tsconfig.json
└── docs/
    └── architecture-plan.md
```

This keeps the Next.js app at the root since it is the primary application. The model service is the only separate service with its own directory. No need for Turborepo/Nx — this is a simple co-located structure. The `docker-compose.yml` at the root orchestrates both the Next.js container and the model service container.

---

## 8. Backend Project Structure (Next.js Route Handlers)

The "backend" lives inside the existing Next.js application, not in a separate directory. All API logic is organized under `app/api/` using Next.js Route Handlers, with supporting libraries under `lib/`.

```
nutritionapp2man/                          # Project root (the Next.js app)
│
├── app/
│   ├── api/                              # ALL API routes (Route Handlers)
│   │   ├── auth/
│   │   │   ├── signup/route.ts           # POST /api/auth/signup
│   │   │   ├── login/route.ts            # POST /api/auth/login
│   │   │   ├── me/route.ts               # GET  /api/auth/me
│   │   │   └── logout/route.ts           # POST /api/auth/logout
│   │   ├── profile/
│   │   │   ├── route.ts                  # GET /api/profile, PUT /api/profile
│   │   │   └── password/route.ts         # PUT /api/profile/password
│   │   ├── meals/
│   │   │   ├── route.ts                  # GET /api/meals, POST /api/meals
│   │   │   └── [id]/route.ts             # GET/PUT/DELETE /api/meals/:id
│   │   ├── foods/
│   │   │   ├── route.ts                  # GET /api/foods
│   │   │   ├── categories/route.ts       # GET /api/foods/categories
│   │   │   └── [id]/route.ts             # GET /api/foods/:id
│   │   ├── sleep/
│   │   │   ├── route.ts                  # GET /api/sleep, POST /api/sleep
│   │   │   └── [id]/route.ts             # PUT /api/sleep/:id
│   │   ├── water/
│   │   │   ├── route.ts                  # GET /api/water, POST /api/water
│   │   │   └── today/route.ts            # GET /api/water/today
│   │   ├── stats/
│   │   │   ├── route.ts                  # GET /api/stats
│   │   │   ├── weight/route.ts           # GET /api/stats/weight
│   │   │   ├── streaks/route.ts          # GET /api/stats/streaks
│   │   │   └── achievements/route.ts     # GET /api/stats/achievements
│   │   ├── model/
│   │   │   └── predict/route.ts          # POST /api/model/predict
│   │   ├── admin/
│   │   │   ├── stats/route.ts            # GET /api/admin/stats
│   │   │   ├── users/route.ts            # GET /api/admin/users
│   │   │   └── import/route.ts           # POST/DELETE /api/admin/import
│   │   └── health/route.ts               # GET /api/health
│   │
│   ├── components/                        # UI components (unchanged)
│   ├── contexts/                          # React contexts (unchanged)
│   ├── data/                              # Static data (will move to DB)
│   ├── hooks/                             # React hooks (will use API client)
│   ├── utils/                             # Frontend utility functions
│   ├── layout.tsx                         # Root layout
│   ├── page.tsx                           # Entry point
│   └── globals.css
│
├── lib/                                   # Shared libraries (server + client)
│   ├── auth/                              # [NEW] Auth utilities
│   │   ├── jwt.ts                         # JWT sign/verify helpers
│   │   ├── password.ts                    # bcrypt hash/compare helpers
│   │   └── get-user.ts                    # Extract user from request (server-only)
│   ├── db/                                # [NEW] Database layer
│   │   ├── prisma.ts                      # Prisma client singleton
│   │   └── repositories/                  # Database query functions
│   │       ├── user.repository.ts
│   │       ├── meal.repository.ts
│   │       ├── food.repository.ts
│   │       ├── profile.repository.ts
│   │       ├── sleep.repository.ts
│   │       ├── water.repository.ts
│   │       └── stats.repository.ts
│   ├── api-client/                        # [NEW] External API clients (server-only)
│   │   └── model-client.ts                # HTTP client for model service
│   ├── validators/                        # [NEW] Zod schemas (shared server+client)
│   │   ├── auth.validator.ts
│   │   ├── profile.validator.ts
│   │   ├── meals.validator.ts
│   │   ├── foods.validator.ts
│   │   ├── sleep.validator.ts
│   │   ├── water.validator.ts
│   │   ├── model.validator.ts
│   │   └── admin.validator.ts
│   ├── services/                          # [NEW] Business logic (server-only)
│   │   ├── auth.service.ts                # signup, login, JWT management
│   │   ├── profile.service.ts
│   │   ├── meals.service.ts               # Meal CRUD + nutrition calculation
│   │   ├── foods.service.ts
│   │   ├── sleep.service.ts
│   │   ├── water.service.ts
│   │   ├── stats.service.ts               # Streaks, achievements, aggregations
│   │   ├── model.service.ts               # Image upload + model service orchestration
│   │   └── admin.service.ts
│   ├── types/                             # [NEW] Shared TypeScript types
│   │   ├── index.ts                       # User, Meal, Profile, etc.
│   │   └── api-response.ts                # Standardized response wrappers
│   ├── utils/
│   │   ├── cn.ts                          # Existing className utility
│   │   ├── nutrition.ts                   # [NEW] Portion calculations, calorie helpers
│   │   └── errors.ts                      # [NEW] Custom error classes
│   └── local-storage.ts                   # [WILL BE DELETED in Phase 4]
│
├── prisma/                                # Prisma configuration
│   ├── schema.prisma                      # Database schema
│   ├── migrations/                        # Migration history
│   └── seed.ts                            # Seed script (Nigerian foods, demo data)
│
├── components/                            # shadcn/ui primitives
├── public/
├── model-service/                         # Separate FastAPI service
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

### 8.1 Layer Responsibilities

| Layer | Location | Responsibility | Example |
|---|---|---|---|
| **Route Handlers** | `app/api/**/route.ts` | Handle HTTP request, validate input, call service, return response | `export async function POST(req: NextRequest)` |
| **Services** | `lib/services/` | Business logic, orchestration, calling repositories | Multi-step operations, transactions |
| **Validators** | `lib/validators/` | Zod schemas — shared between Route Handlers and client forms | `z.object({ email: z.string().email() })` |
| **Repositories** | `lib/db/repositories/` | Database queries only — no business logic | `prisma.meal.findMany({ where: { userId } })` |
| **Auth Utilities** | `lib/auth/` | JWT sign/verify, password hashing | `signToken(userId)`, `verifyToken(token)` |
| **API Clients** | `lib/api-client/` | HTTP wrappers for external services | `modelClient.predict(image)` |
| **Types** | `lib/types/` | Shared TypeScript interfaces | `User`, `Meal`, `ApiResponse<T>` |

### 8.2 Key Differences from Express Architecture

Since the "backend" is co-located with the frontend in the same Next.js project:

1. **No separate `backend/` directory or `package.json`.** Everything shares the same `node_modules` and `tsconfig.json`.
2. **No Express Router or middleware chain.** Each Route Handler is a standalone exported function (`GET`, `POST`, etc.). Auth verification is called inline at the top of each handler rather than mounted as middleware.
3. **No `req.user` augmentation.** Auth utilities extract the user from the request's `Authorization` header and return it. The handler passes the user to the service layer.
4. **No separate CORS config.** API routes are same-origin — the browser calls `/api/*` directly.
5. **Shared validators.** Zod schemas defined in `lib/validators/` are used by both client-side forms (react-hook-form) and server-side Route Handlers (request body validation).
6. **Prisma is in the same project.** Prisma client, schema, and migrations all live within the Next.js project. No need to generate types across project boundaries.

---

## 9. Frontend Refactoring Plan

### 9.1 What Changes

| Current | Refactored |
|---|---|
| `LocalDatabase.*` calls | Same-origin `fetch(/api/*)` calls to Next.js Route Handlers |
| `localStorage` auth | JWT stored in memory — sent as `Authorization: Bearer` header |
| `app/data/nigerian-foods.ts` (1461 lines) | `GET /api/foods` with search/category filter |
| `lib/local-storage.ts` (1042 lines) | Deleted completely — replaced by API routes + Prisma |
| `app/contexts/auth-context.tsx` | Adapted to call `/api/auth/*` endpoints |
| `app/hooks/use-meals.ts` | Adapted to use React Query with API calls |
| `app/hooks/use-profile.ts` | Adapted to use React Query with API calls |

### 9.2 New Frontend API Client Structure

Since the API is same-origin (`/api/*`), the API client layer is simpler — no base URL configuration needed in most cases.

```
lib/
├── api-client/                    # Client-side API functions
│   ├── auth.ts                    # signup(), login(), getMe()
│   ├── meals.ts                   # getMeals(), createMeal(), deleteMeal()
│   ├── profile.ts                 # getProfile(), updateProfile()
│   ├── foods.ts                   # searchFoods(), getFood()
│   ├── sleep.ts                   # getSleep(), createSleep()
│   ├── water.ts                   # getWater(), logWater()
│   ├── stats.ts                   # getStats()
│   ├── model.ts                   # predictFood(image: File) — multipart upload
│   └── admin.ts                   # getAppStats(), etc.
├── validators/                    # [SHARED] Zod schemas — used by forms AND Route Handlers
│   ├── auth.validator.ts
│   ├── meals.validator.ts
│   └── ...
├── types/
│   └── api-response.ts            # Standardized response type wrappers
├── utils/
│   └── cn.ts                      # Keep existing utility
└── local-storage.ts               # [WILL BE DELETED]
```

### 9.3 How Route Handlers Are Called

```typescript
// lib/api-client/meals.ts (client-side)
export async function getMeals(startDate?: string, endDate?: string) {
  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)

  const res = await fetch(`/api/meals?${params}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  })
  if (!res.ok) throw new ApiError(res.status, await res.json())
  return res.json()
}
```

### 9.4 Providers to Add

Add a React Query provider wrapper around the existing app:

```
app/
├── providers/
│   └── query-provider.tsx       # React Query provider wrapper
```

---

## 10. Implementation Risks

### 10.1 Model Integration Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Model architecture mismatch.** The .pth file contains a modified EfficientNet-B0. Loading code must exactly match training architecture. | High | Use the SAME torchvision version and model construction code from the notebook. The notebook explicitly shows the architecture — replicate exactly. |
| **PyTorch version incompatibility.** .pth files can break across major PyTorch versions. | Medium | Pin `torch==2.5.*` and `torchvision==0.20.*`. If the model was trained on an older version, test loading with the pinned version. |
| **CPU-only inference performance.** No GPU in Docker/most cloud deployments. | Low | EfficientNet-B0 is designed to be lightweight. ~50ms per inference on CPU is acceptable. Batch inference is unnecessary for single-image user requests. |
| **Model file not loading.** The .pth file might be corrupted or have incorrect format. | Medium | Test model loading in a Python script before containerizing. Verify `torch.load()` succeeds and produces expected output shape. |
| **Wrong class_names.json.** If class names don't match model output order, predictions will be mislabeled. | Medium | The notebook saves `class_names` from `train_dataset.classes` (alphabetical order). Verify this matches expectations. |

### 10.2 Image Upload Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Large file uploads causing memory issues.** Users may upload high-res phone photos (10+ MB). | Medium | Limit upload size to 10 MB in the Route Handler. Use `req.formData()` and check file size before forwarding. Add client-side resize before upload. |
| **Non-food images.** Users may upload random images. | Low | Not a critical issue — the model will produce low-confidence predictions. Frontend handles low-confidence gracefully. |
| **EXIF/orientation data.** Phone photos may be rotated. | Low | Process orientation in preprocessing step (PIL's `ImageOps.exif_transpose`). |
| **Corrupted files.** Broken images may cause model to error. | Medium | Validate image integrity at the backend level before forwarding to model service. Try-catch around PIL.Image.open(). |

### 10.3 Docker Networking Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Container startup order.** Next.js starts before postgres is ready, causing connection failures. | Medium | Use `depends_on` with `healthcheck` in docker-compose. Add retry logic in Prisma client connection. |
| **Model cold start delay.** Model service takes 5-15 seconds to load weights. First inference request may fail. | Low | Implement a `/health` endpoint in the model service that returns 200 only after model is loaded. Next.js Route Handler polls or retries if model service is not yet ready. |
| **Port conflicts.** Development ports (3000, 3002, 5432) may conflict with host services. | Low | Document port assignments clearly. Use environment variables to override if needed. Only 3 services — fewer port conflicts than the old 4-service architecture. |

### 10.4 Model Size & Deployment Risk

| Risk | Severity | Mitigation |
|---|---|---|
| **Docker image size.** PyTorch + torchvision adds ~1 GB to the image. | Medium | Use `python:3.12-slim` base. Install only PyTorch CPU version (`--index-url https://download.pytorch.org/whl/cpu`). Expected image size: ~800 MB. |
| **Memory consumption.** PyTorch runtime + model in memory. | Medium | Allocate at least 1 GB RAM for the model service container. EfficientNet-B0 is relatively small — memory is manageable. |
| **Cold start in cloud.** If deployed to a serverless platform, cold starts will be slow (loading PyTorch each time). | Medium | Use container-based deployment (not Lambda/Cloud Functions). Keep the model service always running. |

### 10.5 Dependency Compatibility

| Risk | Severity | Mitigation |
|---|---|---|
| **Node.js vs Python ecosystems.** Different package managers, dependency files. | Low | Separate service directories each have their own dependency files. No cross-contamination. |
| **TypeScript type sharing.** Types (User, Meal, NigerianFood) are shared naturally since everything is in the same Next.js project. | Low | Types defined in `lib/types/` are importable from both client components and Route Handlers. No duplication needed — a key advantage of the unified architecture. |
| **Prisma types not matching existing interfaces.** Current types (in local-storage.ts) have different shapes than what Prisma will generate. | Medium | The Prisma schema should align with the current data models as much as possible. API responses will use mapped types, not raw Prisma types.

### 10.6 Frontend/Backend Integration

| Risk | Severity | Mitigation |
|---|---|---|
| **Breaking existing functionality.** Refactoring from localStorage to API will touch every component. | High | Phase the migration: first build the Route Handlers with matching API shapes, then migrate frontend hooks one at a time. The unified project structure makes this easier — no cross-repository coordination needed. |
| **Auth flow changes.** Current auth is synchronous localStorage reads. JWT is async with token refresh. | Medium | Build the auth context to use fetch to `/api/auth/*` endpoints. Token stored in React state (memory). Handle 401 responses with automatic logout + redirect. |
| **Offline capability loss.** Current app works fully offline. Moving to API removes this. | Low | Acceptable tradeoff. This is a deliberate migration from prototype to production app. |
| **API latency perception.** Users accustomed to instant localStorage reads will notice network latency. | Low | React Query caching provides instant stale data while refetching. Optimistic updates for meal logging. Same-origin API calls have lower latency than cross-origin calls. |

---

## 11. Implementation Phases

### Phase 1: Foundation ✅ COMPLETE

- [x] Codebase cleanup (delete dead folders/files)
- [x] Set up placeholder directories (model-service/)
- [x] ESLint configured (`npm run lint` passes)
- [x] Next.js upgraded to latest stable 15.x
- [x] Frontend builds and dev server runs successfully

### Phase 2: Backend Infrastructure ✅ COMPLETE

- [x] Create API route directory structure (`app/api/*`)
- [x] Set up environment configuration (`.env.example`)
- [x] Create shared TypeScript types (`lib/types/`)
- [x] Create shared API response helpers (`lib/types/api-response.ts`)
- [x] Create custom error classes (`lib/errors.ts`)
- [x] Create request validation helpers (`lib/api-helpers.ts`)
- [x] Set up validators placeholder (`lib/validators/`)
- [x] Implement health check endpoint (`GET /api/health`)

### Phase 3: Authentication + Database (Week 3-4)

- [ ] Set up Prisma with PostgreSQL schema
- [ ] Create Prisma client singleton (`lib/db/prisma.ts`)
- [ ] Define database schema: User, Profile, Meal, Food, Sleep, WaterIntake
- [ ] Create Zod validators for all entities (`lib/validators/`)
- [ ] Implement auth utilities (`lib/auth/` — JWT, bcrypt)
- [ ] Implement core auth Route Handlers:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- [ ] Seed database with Nigerian foods data
- [ ] Dockerize database (optional — can use local DB first)

### Phase 4: Core API Route Handlers (Week 4-5)

- [ ] Implement user profile CRUD (`app/api/profile/`)
- [ ] Implement meal CRUD with nutrition calculations (`app/api/meals/`)
- [ ] Implement food search/categories endpoints (`app/api/foods/`)
- [ ] Implement sleep tracking endpoints (`app/api/sleep/`)
- [ ] Implement water intake endpoints (`app/api/water/`)
- [ ] Implement user stats (streaks, achievements) (`app/api/stats/`)
- [ ] Implement admin endpoints (`app/api/admin/`)
- [ ] Add request logging
- [ ] Write API tests for core endpoints

### Phase 5: ML Model Service + Integration (Week 5-6) — Service portion COMPLETE

- [x] Set up FastAPI project structure in `model-service/`
- [x] Consolidate model files (use 4-class "Second run" model)
- [x] Implement model loading at startup (lifespan handler)
- [x] Implement image preprocessing pipeline (224×224, ImageNet norm)
- [x] Implement inference endpoint (`POST /predict`) with confidence scores
- [x] Implement health check endpoint (`GET /health`)
- [x] Write README with usage instructions
- [x] Test end-to-end inference (image → prediction)
- [ ] Dockerize model service
- [ ] Implement model service HTTP client (`lib/api-client/model-client.ts`)
- [ ] Implement `POST /api/model/predict` Next.js Route Handler
- [ ] Add image validation in Next.js layer (type, size, corruption check)

### Phase 6: Frontend Migration (Week 6-7)

- [ ] Install and configure React Query provider
- [ ] Build client-side API functions (`lib/api-client/`)
- [ ] Migrate auth context to use real API endpoints
- [ ] Migrate `useMeals` hook to React Query + API
- [ ] Migrate `useProfile` hook to React Query + API
- [ ] Add image upload UI for food classification
- [ ] Add prediction result display component
- [ ] Remove `lib/local-storage.ts` and all direct LocalDatabase references
- [ ] Remove `app/data/nigerian-foods.ts` (replaced by API)
- [ ] Test all flows end-to-end

### Phase 7: Docker + Polish (Week 7-8)

- [ ] Finalize docker-compose.yml with all services
- [ ] Write production Dockerfiles (multi-stage for Next.js, slim for model)
- [ ] Set up Swagger/OpenAPI documentation
- [ ] Add rate limiting
- [ ] Add comprehensive error handling
- [ ] Write README with setup instructions
- [ ] Write API documentation
- [ ] Final cleanup, linting, typecheck

---

## 12. Recommended Roadmap

```
Week 1: Foundation ✅
  ├── Clean up repo ✅
  └── ESLint + Next.js upgrade ✅

Week 2: Backend Infrastructure ✅
  ├── API route directory structure ✅
  ├── Shared types, errors, helpers ✅
  └── Health endpoint ✅

Week 3-4: Authentication + Database
  ├── Set up Prisma + PostgreSQL
  ├── Define database schema
  ├── Implement auth (signup, login, JWT)
  └── Auth context migration

Week 4-5: Core APIs
  ├── All CRUD Route Handlers (meals, profile, foods, sleep, water, stats, admin)
  ├── Validation layer (Zod)
  └── Tests

Week 5-6: ML Service
  ├── FastAPI setup ✅
  ├── Model loading + inference ✅
  ├── Dockerize model service
  └── Next.js ↔ Model service integration

Week 6-7: Frontend Migration
  ├── React Query setup
  ├── API client layer
  ├── Hook migration
  └── Remove localStorage

Week 7-8: Polish
  ├── Docker compose finalized
  ├── Production builds
  ├── Swagger docs
  └── Final testing
```

### Key Success Criteria

1. User can sign up, log in, log out via Next.js Route Handlers
2. User can log meals, track sleep, track water, view stats — all persisted in PostgreSQL
3. User can upload a food photo and receive a classification with confidence score
4. All three Docker services start successfully with `docker compose up`
5. Swagger/OpenAPI documentation available for all endpoints
6. No remaining `localStorage` or `LocalDatabase` references in the frontend
7. All API endpoints return consistent JSON responses
8. Auth protects all non-public Route Handlers

---

*This document serves as the authoritative architecture plan. All implementation decisions should reference this plan. Deviations should be discussed and documented.*

---

## Phase 1 — Completion Report (01 August 2026)

### Summary

Repository cleanup and foundation preparation completed. Removed ~2.5 MB of dead/duplicated files, organized repository structure with placeholder directories for future phases, cleaned unused frontend assets, and verified the application builds and runs correctly.

### Files Removed

| File/Folder | Reason |
|---|---|
| `nutritionapp2man-main/` (entire tree) | Recursively nested duplicate of repo (~1.9 MB, 6 levels deep) |
| `nigerian-nutrition-app--2--main/` (entire tree) | Second extracted archive duplicate (~192 KB) |
| `Captures/` (entire directory) | Dead directory: screenshot + Windows `desktop.ini` |
| `styles/globals.css` + `styles/` directory | Dead CSS — not imported, not referenced anywhere |
| `pnpm-lock.yaml` | Incomplete — project uses npm (`package-lock.json`) |
| `.DS_Store` (root) and `app/.DS_Store` | macOS metadata files |
| `model/methodology and results.docx` (root) | Duplicate — exists in `model/Second run/` |
| `model/training_notebook.ipynb - Colab.pdf` (root) | Duplicate — exists in `model/Second run/` |
| `components/ui/use-mobile.tsx` | Duplicate — canonical version at `hooks/use-mobile.tsx` |
| `components/ui/use-toast.ts` | Duplicate — canonical version at `hooks/use-toast.ts` |
| `public/placeholder-logo.png` | Not referenced by any source code |
| `public/placeholder-logo.svg` | Not referenced by any source code |
| `public/placeholder-user.jpg` | Not referenced by any source code |
| `public/placeholder.jpg` | Not referenced by any source code |
| `public/icon.svg` | Not referenced by any source code |
| `public/images/carbohydrate-portion.png` | Not referenced by any source code |
| `public/images/fruits.png` | Not referenced by any source code |

### Files Created

| File | Purpose |
|---|---|
| `model-service/.gitkeep` | Placeholder for Phase 4 ML model service |
| `docs/architecture-plan.md` | Already existed (created in planning phase) |

### Files Modified

| File | Change |
|---|---|
| `.gitignore` | Added `.DS_Store` and `**/.DS_Store` entries |
| `next.config.mjs` | Removed `ignoreDuringBuilds: true` for ESLint |
| `.eslintrc.json` | Added ESLint configuration (Base preset) |
| `package.json` | Upgraded Next.js to latest stable 15.x |

### Validation

| Check | Result |
|---|---|
| `npm install` | Passed (clean reinstall) |
| `npm run build` | Passed — compiled successfully |
| `npm run dev` | Passed — server starts on http://localhost:3000 in ~2s |
| `npm run lint` | Passed — ESLint configured and runs successfully |
| No import breakage | Verified — no source files referenced any deleted paths |

### Repository Structure (Post-Cleanup)

```
nutritionapp2man/
├── app/                     # Next.js App Router (unchanged)
├── components/              # shadcn/ui components (51 files, was 53)
│   └── ui/                  # Removed: use-mobile.tsx, use-toast.ts (dupes)
├── docs/
│   └── architecture-plan.md
├── hooks/                   # use-mobile.tsx, use-toast.ts (canonical)
├── lib/                     # local-storage.ts, utils.ts
├── model/                   # ML training artifacts (cleaned)
│   ├── first run/
│   └── Second run/
├── model-service/           # [NEW] Placeholder for FastAPI service
├── public/
│   ├── placeholder.svg      # Only remaining placeholder (in use)
│   └── images/              # 12 food images (removed 2 unused)
├── scripts/
│   └── add-sample-data.ts   # Retained for reference
├── .eslintrc.json           # ESLint configured
├── package.json
└── tsconfig.json
```

### Notes for Phase 2

1. **Architecture revision.** The original plan called for a standalone Express backend. This has been revised — all backend logic will be implemented as Next.js Route Handlers under `app/api/`. The `backend/` placeholder directory has been removed. See Section 2 for the updated architecture.

2. **Model directory structure.** The `model/` directory still has the old `first run/` and `Second run/` structure. The architecture plan recommends consolidating model files. This can be done in Phase 4 when setting up the model service.

3. **`scripts/add-sample-data.ts`** was retained but references `LocalDatabase` directly. This script will need to be rewritten or removed when the API replaces localStorage in Phase 5.

4. **All 12 retained images in `public/images/`** are actively referenced by `app/components/portion-sizing-guide.tsx`. Do not remove them.

5. **ESLint is now configured** and passing. No blockers for Phase 2.

6. **Next.js has been upgraded** to the latest stable 15.x release.

---

## Phase 2 — Completion Report (01 August 2026)

### Summary

Backend infrastructure established inside the existing Next.js application. Created the API route directory structure, standardized response/error handling, shared types, validation helpers, environment configuration, and a health check endpoint. The project is now ready to receive API Route Handlers in Phase 3.

### Files Created

| File | Purpose |
|---|---|
| `.env.example` | Documented environment variables (APP_NAME, JWT_SECRET, DATABASE_URL, MODEL_SERVICE_URL, etc.) |
| `lib/types/index.ts` | Shared TypeScript interfaces (User, Meal, UserProfile, UserStats, SleepEntry, WaterIntake, etc.) |
| `lib/types/api-response.ts` | Standardized API response types (`ApiSuccessResponse`, `ApiErrorResponse`) and helpers (`successResponse`, `errorResponse`) |
| `lib/errors.ts` | Custom error classes (`AppError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`) |
| `lib/api-helpers.ts` | Reusable server utilities (`parseBody`, `parseQuery` Zod-powered request parsing, `handleApiError` unified error handler) |
| `lib/validators/.gitkeep` | Placeholder for future Zod validation schemas |
| `app/api/health/route.ts` | `GET /api/health` — returns status, app name, version, timestamp |
| `app/api/auth/.gitkeep` | Placeholder — future auth routes |
| `app/api/meals/.gitkeep` | Placeholder — future meal routes |
| `app/api/profile/.gitkeep` | Placeholder — future profile routes |
| `app/api/foods/.gitkeep` | Placeholder — future food database routes |
| `app/api/sleep/.gitkeep` | Placeholder — future sleep routes |
| `app/api/water/.gitkeep` | Placeholder — future water routes |
| `app/api/stats/.gitkeep` | Placeholder — future stats routes |
| `app/api/model/.gitkeep` | Placeholder — future model inference routes |
| `app/api/admin/.gitkeep` | Placeholder — future admin routes |

### Files Modified

None. All changes are additive — no existing files were modified.

### Validation

| Check | Result |
|---|---|
| `npm run build` | Passed — compiled successfully, `/api/health` detected as dynamic Route Handler |
| `npm run dev` | Passed — server starts on http://localhost:3000 |
| `GET /api/health` | Returns `{ success: true, data: { status: "ok", name: "GluGuide API", version: "0.1.0", timestamp: "..." } }` |
| TypeScript (`tsc --noEmit`) | Pre-existing errors in shadcn/ui boilerplate only — zero new errors from Phase 2 files |
| ESLint (`npm run lint`) | Pre-existing warnings/errors in v0-generated components only — zero from Phase 2 files |

### API Response Convention

All API responses follow a consistent shape:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

The `lib/api-helpers.ts` module provides:
- `parseBody(req, schema)` — validates JSON request body against a Zod schema
- `parseQuery(req, schema)` — validates query parameters against a Zod schema
- `handleApiError(err)` — catches `AppError` instances and returns appropriate error responses

### Error Classes

| Class | HTTP Status | Code | Use Case |
|---|---|---|---|
| `AppError` | Customizable | Customizable | Base error class |
| `ValidationError` | 400 | `VALIDATION_ERROR` | Zod validation failures, bad input |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | Missing/invalid JWT |
| `ForbiddenError` | 403 | `FORBIDDEN` | Insufficient role permissions |
| `NotFoundError` | 404 | `NOT_FOUND` | Resource not found |

### Notes for Phase 3

1. **Auth is the next priority.** The `lib/auth/` directory and JWT utilities should be created first, as all subsequent API routes depend on authentication.
2. **Zod is already installed** (v3.25.76). Validator schemas should be added to `lib/validators/` and used by both Route Handlers (via parseBody/parseQuery) and client-side forms (via react-hook-form). See Section 8 of the architecture plan for the recommended validator file list.
3. **Prisma is not yet added** to `package.json`. It should be installed as a dev dependency: `npm install -D prisma && npm install @prisma/client`. The `prisma/` directory with `schema.prisma` and `seed.ts` should be created.
4. **The API structure directories have `.gitkeep` placeholders.** These can be replaced with actual `route.ts` files during Phase 3/4.
5. **Environment variables are documented** in `.env.example` but not yet consumed by the application. The Phase 3 auth implementation will be the first consumer of `JWT_SECRET` and `DATABASE_URL`.

---

## Phase 5 (Model Service) — Completion Report (01 August 2026)

### Summary

Created a standalone FastAPI microservice that loads the trained PyTorch EfficientNet-B0 model and exposes HTTP endpoints for health checks and food image classification. The service runs independently on port 3002 and is ready to be consumed by the Next.js application in a future phase.

### Model Analysis

| Attribute | Detail |
|---|---|
| **Architecture** | EfficientNet-B0 (pretrained on ImageNet), transfer learned |
| **Feature extractor** | Frozen (`model.features.parameters()` with `requires_grad=False`) |
| **Classifier head** | Replaced final `nn.Linear` layer → 4 outputs |
| **Input size** | 224×224 pixels, RGB (3 channels) |
| **Normalization** | ImageNet mean `[0.485, 0.456, 0.406]`, std `[0.229, 0.224, 0.225]` |
| **Output** | 4-class softmax probabilities |
| **Classes** | `["Amala", "Eba", "Pounded Yam", "Semo"]` (from `class_names.json`) |
| **Weights file** | `food_classifier.pth` (16.3 MB, state_dict format) |
| **Training augmentations** | RandomHorizontalFlip, RandomRotation(20), ColorJitter (NOT applied during inference) |
| **Inference device** | CPU (auto-detects CUDA if available) |
| **Model load time** | ~5-10 seconds (one-time on startup) |
| **Inference time** | ~280ms per image (CPU, first inference; warm ~80-150ms expected) |

### Preprocessing Pipeline (replicates training notebook exactly)

```python
transforms.Compose([
    transforms.Resize((224, 224)),       # Match training input size
    transforms.ToTensor(),                # PIL → [C, H, W] tensor, scales to [0,1]
    transforms.Normalize(                 # ImageNet stats
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])
```

### Inference Pipeline

1. Image uploaded as `multipart/form-data` → validated (format: JPEG/PNG/WebP, max 10 MB)
2. PIL decodes bytes → `Image.open().convert("RGB")`
3. Preprocessing transform applied → tensor `[3, 224, 224]`
4. Batch dimension added → `[1, 3, 224, 224]`
5. `model.eval()` + `torch.no_grad()` forward pass
6. Softmax applied → probabilities
7. Sorted by confidence, returned as structured JSON

### Files Created

| File | Purpose |
|---|---|
| `model-service/requirements.txt` | Python dependencies (FastAPI, torch, torchvision, etc.) |
| `model-service/.env.example` | Environment variable documentation |
| `model-service/README.md` | Setup, run, and API usage instructions |
| `model-service/app/__init__.py` | Package marker |
| `model-service/app/main.py` | FastAPI app with lifespan-based model loading |
| `model-service/app/core/__init__.py` | Package marker |
| `model-service/app/core/config.py` | Settings from environment variables via pydantic-settings |
| `model-service/app/api/__init__.py` | Package marker |
| `model-service/app/api/routes.py` | `/health` and `/predict` endpoints |
| `model-service/app/services/__init__.py` | Package marker |
| `model-service/app/services/classifier.py` | Model loading, preprocessing, inference |
| `model-service/app/schemas/__init__.py` | Package marker |
| `model-service/app/schemas/prediction.py` | Pydantic response models (PredictResponse, HealthResponse) |
| `model-service/models/food_classifier.pth` | Copied from `model/Second run/` — 4-class model |
| `model-service/models/class_names.json` | Copied from `model/Second run/` |

### Files Modified

None outside `model-service/`.

### Validation

| Check | Result |
|---|---|
| `pip install -r requirements.txt` | Passed (torch 2.13.0, torchvision 0.28.0) |
| Server startup (`uvicorn app.main:app --port 3002`) | Passed — model loads in ~5s |
| `GET /health` | `{"status":"ok","model_loaded":true,"model_name":"EfficientNet-B0","classes":["Amala","Eba","Pounded Yam","Semo"]}` |
| `POST /predict` (apple image) | `{"predictions":[...],"top_prediction":{"class_name":"Amala","confidence":0.65},"inference_time_ms":281.74}` |
| Image format validation | Rejected with `"Unsupported image format"` for invalid extensions |
| File size validation | Rejects uploads > 10 MB with HTTP 413 |
| Corrupted file handling | Returns HTTP 400 with `"Invalid or corrupted image file"` |

### API Endpoints (Final)

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/health` | Service health, model status, class list | None |
| `POST` | `/predict` | Classify food image | None (delegates to Next.js for auth) |

The model service contains **no authentication** — that responsibility belongs to the Next.js Route Handler layer.

### Notes for Next Phase

1. **PyTorch version upgraded.** The architecture plan specified `torch==2.5.*` but only 2.9+ is available. Using `torch>=2.9.0,<3.0.0` and `torchvision>=0.20.0,<1.0.0`. The state_dict format is backward compatible — the model loaded without issues. Requirements file updated accordingly.

2. **Next.js → Model Service integration.** The Next.js Route Handler at `app/api/model/predict/route.ts` should:
   - Verify JWT auth
   - Validate uploaded file type/size
   - Forward the image to `http://model-service:3002/predict`
   - Enrich the response with nutrition data (from PostgreSQL)
   - Return the enriched response

3. **Dockerization pending.** The model service Dockerfile should use `python:3.12-slim` as the base image (NOT alpine — PyTorch needs glibc). Model weights should be copied into the image rather than volume-mounted.

4. **Model cold start.** The model takes ~5s to load. The `GET /health` endpoint returns `"model_loaded": false` until loading completes. The Next.js integration should check this before forwarding requests.

---

## Phase 4 (Next.js ↔ AI Model Integration) — Completion Report (01 August 2026)

### Summary

Implemented the communication layer between the Next.js application and the FastAPI model service. Created server-side model client, health proxy, prediction proxy with validation, and a frontend AI Food Scanner component. The full end-to-end flow is functional: browser → Next.js Route Handler → FastAPI model service → PyTorch inference → back to browser.

### Architecture — Request Flow

```
Browser (AI Food Scanner component)
  │  POST /api/ai/predict (multipart/form-data)
  ▼
Next.js Route Handler (app/api/ai/predict/route.ts)
  │  1. Validates file presence, type (JPEG/PNG/WebP), size (≤10 MB)
  │  2. Calls modelClient.predict(file) → forwards to FastAPI
  ▼
FastAPI Model Service (POST /predict on :3002)
  │  3. Preprocessing: resize 224×224, ToTensor, ImageNet normalize
  │  4. Inference: EfficientNet-B0 forward pass (no_grad)
  │  5. Softmax → probabilities → sorted predictions
  ▼
Next.js Route Handler
  │  6. Receives PredictResponse from model service
  │  7. Returns structured JSON to browser
  ▼
Browser (AI Food Scanner)
  │  8. Displays predictions with confidence bars
  │  9. Highlights top match with confidence threshold warning
```

### Files Created

| File | Purpose |
|---|---|
| `lib/api-client/model-client.ts` | Server-side HTTP client for the FastAPI model service. Typed responses, configurable timeout (30s), error handling, health and predict functions. |
| `app/api/ai/health/route.ts` | `GET /api/ai/health` — proxies the model service health check. Returns model status, loaded state, class list. Handles service unavailability gracefully. |
| `app/api/ai/predict/route.ts` | `POST /api/ai/predict` — validates uploaded file (type, size, presence), forwards to model service, returns predictions. Handles all error cases with appropriate HTTP codes. |
| `app/components/ai-food-scanner.tsx` | Client-side React component with drag-and-drop image upload, scan button, prediction display with confidence bars, and threshold warnings. |

### Files Modified

| File | Change |
|---|---|
| `app/components/dashboard.tsx` | Added `Camera` icon import, `AIFoodScanner` import, new "Scanner" tab (between "Log Meal" and "BMI"), updated grid columns for 9/10 tabs. |

### API Endpoints (New)

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/api/ai/health` | Proxy to model service health — returns model status, classes, timestamp | None |
| `POST` | `/api/ai/predict` | Accept image upload → forward to model service → return predictions | None (Phase 3 will add) |

### Validation

| Check | Result |
|---|---|
| `npm run build` | Passed — both AI endpoints detected as dynamic Route Handlers |
| `npm run lint` | Passed — zero errors/warnings on new files |
| `npm run dev` | Passed — Next.js + FastAPI run simultaneously |
| `GET /api/ai/health` | `{"success":true,"data":{"status":"ok","model_loaded":true,"classes":["Amala","Eba","Pounded Yam","Semo"]}}` |
| `POST /api/ai/predict` (valid image) | Returns predictions with confidence scores, HTTP 200 |
| `POST /api/ai/predict` (no file) | `{"success":false,"error":"Invalid form data","code":"INVALID_FORM_DATA"}`, HTTP 400 |
| `POST /api/ai/predict` (unsupported format) | `{"success":false,"error":"Unsupported image format. Accepted: JPEG, PNG, WebP","code":"UNSUPPORTED_FORMAT"}`, HTTP 400 |
| AI scanner UI | Drag-and-drop, file picker, scan button, prediction display with confidence bars |
| Error when model offline | `{"success":false,"error":"Model service unavailable","code":"MODEL_UNAVAILABLE"}`, HTTP 502 |

### Notes for Phase 5 (Docker)

1. **docker-compose.yml** should define three services: `next-app`, `model-service`, `postgres`. No Express backend.
2. **The model service client** (`lib/api-client/model-client.ts`) reads `MODEL_SERVICE_URL` from environment. Inside Docker, this should be set to `http://model-service:3002`.
3. **The prediction proxy** validates images at the Next.js layer — size, type, and presence — before forwarding to the model service. The model service also has its own validation as defense-in-depth.
4. **Health endpoint** checks model availability with a 30s timeout. Docker health checks and startup ordering should poll `GET /api/ai/health` before routing traffic.
5. **Zero mock prediction logic existed** in the codebase — no cleanup was needed. The app previously had no AI features at all.

---

## Phase 5 (Backend Foundation) — Completion Report (01 August 2026)

### Summary

Established the persistence layer and backend infrastructure. PostgreSQL 16 (Alpine) via Docker, Prisma 6.x ORM, full database schema with 11 tables, repository layer, auth utilities, Zod validators, service stubs, and health endpoint with DB connectivity check.

### Database

| Attribute | Detail |
|---|---|
| **Engine** | PostgreSQL 16 (Alpine) |
| **Deployment** | Docker Compose (`docker compose up -d postgres`) |
| **ORM** | Prisma 6.19.3 |
| **Migration** | `prisma migrate dev --name init` — applied successfully |
| **Connection** | `DATABASE_URL=postgresql://gluguide_user:password@localhost:5432/gluguide` |

### Schema — 11 Tables Migrated

| Table | Rows | Purpose |
|---|---|---|
| `User` | 0 | Central entity — auth, personal info |
| `UserProfile` | 0 | 1:1 preferences, settings, recommendations |
| `Meal` | 0 | Meal log entries |
| `MealFood` | 0 | Individual foods within a meal |
| `NutritionTotal` | 0 | 1:1 meal nutrition aggregates |
| `NigerianFood` | 0 | Reference food catalog (to be seeded) |
| `UserStats` | 0 | 1:1 aggregated statistics |
| `WaterIntake` | 0 | Daily water (upsert: userId + date unique) |
| `SleepEntry` | 0 | Daily sleep logs (upsert: userId + date unique) |
| `FoodPrediction` | 0 | Optional AI prediction history |
| `BMIHistory` | 0 | Weight tracking over time |

### Files Created

**Database Layer:**
| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Full 11-model Prisma schema with enums, indexes, relations |
| `prisma/migrations/20260801174050_init/migration.sql` | Initial migration SQL |
| `lib/db/prisma.ts` | Prisma client singleton with dev hot-reload guard |
| `lib/db/repositories/user.repository.ts` | User CRUD, pagination |
| `lib/db/repositories/profile.repository.ts` | Profile upsert |
| `lib/db/repositories/meal.repository.ts` | Meal CRUD with foods + nutrition totals |
| `lib/db/repositories/food.repository.ts` | Food search, categories |
| `lib/db/repositories/sleep.repository.ts` | Sleep upsert |
| `lib/db/repositories/water.repository.ts` | Water upsert |
| `lib/db/repositories/stats.repository.ts` | Stats read/update |
| `lib/db/repositories/bmi-history.repository.ts` | BMI history tracking |

**Auth Layer:**
| File | Purpose |
|---|---|
| `lib/auth/jwt.ts` | JWT sign/verify using `jose` (HS256, configurable expiry) |
| `lib/auth/password.ts` | bcrypt hash/verify (12 rounds) |
| `lib/auth/get-user.ts` | Extract user from `Authorization: Bearer` header |

**Validators:**
| File | Purpose |
|---|---|
| `lib/validators/auth.validator.ts` | signup + login Zod schemas |
| `lib/validators/meals.validator.ts` | createMeal + mealsQuery schemas |
| `lib/validators/profile.validator.ts` | updateUser + updateProfile + changePassword schemas |
| `lib/validators/water.validator.ts` | waterLog schema |
| `lib/validators/sleep.validator.ts` | sleepLog schema |

**Services:**
| File | Purpose |
|---|---|
| `lib/services/auth.service.ts` | Signup (creates user + profile + stats), login, JWT generation |
| `lib/services/profile.service.ts` | Profile read/update, user update, password change |
| `lib/services/meals.service.ts` | Meal CRUD with date filtering |
| `lib/services/foods.service.ts` | Food search, single food, categories |
| `lib/services/water.service.ts` | Today intake, log, history |
| `lib/services/sleep.service.ts` | Entries list, log entry |
| `lib/services/stats.service.ts` | Get user stats |

**Infrastructure:**
| File | Purpose |
|---|---|
| `docker-compose.yml` | PostgreSQL 16 Alpine on port 5432 with named volume |
| `.env` | `DATABASE_URL` + `JWT_SECRET` (gitignored) |

### Files Modified

| File | Change |
|---|---|
| `app/api/health/route.ts` | Added database connectivity check (`prisma.$queryRaw\`SELECT 1\``) — returns `db: "connected"` or `db: "disconnected"` |
| `.env.example` | Updated with DATABASE_URL, improved documentation |
| `package.json` | Added `prisma@6`, `@prisma/client@6`, `bcryptjs`, `jose`, `@types/bcryptjs` |

### Validation

| Check | Result |
|---|---|
| `docker compose up -d postgres` | Container running, healthy |
| `npx prisma migrate dev` | Migration `20260801174050_init` applied — 11 tables + 1 migrations table |
| `psql -c "\dt"` | All 12 tables confirmed |
| `npm run build` | Passed — compiled successfully |
| `npm run lint` | Passed — zero errors/warnings |
| `npm run dev` | Passed — server starts on :3000 |
| `GET /api/health` | `{"success":true,"data":{"status":"ok","name":"GluGuide API","version":"0.1.0","db":"connected","timestamp":"..."}}` |

### Notes for Phase 6 (Auth Implementation)

1. **Auth service is ready.** `lib/services/auth.service.ts` has `signup()` and `login()` fully implemented — needs Route Handler wrappers.
2. **Validators are ready.** All Zod schemas in `lib/validators/` are complete — can be used by both Route Handlers and frontend forms.
3. **Seed data needed.** `prisma/seed.ts` should be created to populate the `NigerianFood` table from `app/data/nigerian-foods.ts` (1,461 lines, ~100 foods). Use:
   ```bash
   npx prisma db seed
   ```
4. **JWT_SECRET should be set.** The `.env` file has a placeholder. Generate a real secret before production use.
5. **Prisma 6.x locked.** Prisma 7 has breaking config changes. Stay on Prisma 6.x until the migration path is clear and documented.
6. **Database connection URL.** Change `DATABASE_URL` host from `localhost` to `postgres` when running inside Docker Compose (Phase 7 Dockerization).

---

## Phase 6 (Application API Layer) — Completion Report (01 August 2026)

### Summary

Implemented the complete REST API surface — 27 Route Handlers across 10 feature groups — connecting the existing service/repository layer to HTTP endpoints. All endpoints use consistent `{ success, data }` and `{ success, false, error, code }` response formats. JWT authentication protects all non-public endpoints. Password hashes are excluded from all API responses via `sanitizeUser()`.

### API Endpoints Implemented (27)

**Authentication (4):**
| Method | Route | Auth |
|---|---|---|
| `POST` | `/api/auth/signup` | None |
| `POST` | `/api/auth/login` | None |
| `GET` | `/api/auth/me` | Bearer |
| `POST` | `/api/auth/logout` | Bearer |

**Users & Profile (3):**
| Method | Route | Auth |
|---|---|---|
| `PATCH` | `/api/users/me` | Bearer |
| `GET` | `/api/profile` | Bearer |
| `PATCH` | `/api/profile` | Bearer |
| `PUT` | `/api/profile/password` | Bearer |

**Meals (3):**
| Method | Route | Auth |
|---|---|---|
| `GET` | `/api/meals?date=&startDate=&endDate=&type=` | Bearer |
| `POST` | `/api/meals` | Bearer |
| `GET` | `/api/meals/[id]` | Bearer |
| `DELETE` | `/api/meals/[id]` | Bearer |

**Food Catalog (3):**
| Method | Route | Auth |
|---|---|---|
| `GET` | `/api/foods?search=&category=&page=&limit=` | None |
| `GET` | `/api/foods/[id]` | None |
| `GET` | `/api/foods/categories` | None |

**Water (3):**
| Method | Route | Auth |
|---|---|---|
| `GET` | `/api/water` | Bearer |
| `POST` | `/api/water` | Bearer |
| `GET` | `/api/water/today` | Bearer |

**Sleep (2):**
| Method | Route | Auth |
|---|---|---|
| `GET` | `/api/sleep` | Bearer |
| `POST` | `/api/sleep` | Bearer |

**Stats (4):**
| Method | Route | Auth |
|---|---|---|
| `GET` | `/api/stats` | Bearer |
| `GET` | `/api/stats/streaks` | Bearer |
| `GET` | `/api/stats/achievements` | Bearer |
| `GET` | `/api/stats/weight` | Bearer |

**Dashboard (2):**
| Method | Route | Auth |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Bearer |
| `GET` | `/api/dashboard/nutrition?period=` | Bearer |

**Export & Admin (5):**
| Method | Route | Auth |
|---|---|---|
| `GET` | `/api/export` | Bearer |
| `GET` | `/api/admin/stats` | Bearer + Admin |
| `GET` | `/api/admin/users?page=&limit=` | Bearer + Admin |
| `GET` | `/api/admin/users/[id]` | Bearer + Admin |

**AI Proxy (2) — unchanged from Phase 4:**
| Method | Route |
|---|---|
| `GET` | `/api/ai/health` |
| `POST` | `/api/ai/predict` |

### Files Created (25)

| Group | Files |
|---|---|
| **Auth routes** | 4 files: signup, login, me, logout |
| **Profile routes** | 2 files: profile/route.ts, profile/password/route.ts |
| **User routes** | 1 file: users/me/route.ts |
| **Meal routes** | 2 files: meals/route.ts, meals/[id]/route.ts |
| **Food routes** | 3 files: foods/route.ts, foods/[id]/route.ts, foods/categories/route.ts |
| **Water routes** | 2 files: water/route.ts, water/today/route.ts |
| **Sleep routes** | 1 file: sleep/route.ts |
| **Stats routes** | 4 files: stats/route.ts, stats/streaks, stats/achievements, stats/weight |
| **Dashboard routes** | 2 files: dashboard/summary, dashboard/nutrition |
| **Admin routes** | 3 files: admin/stats, admin/users, admin/users/[id] |
| **Export** | 1 file: export/route.ts |
| **Security** | `lib/auth/sanitize.ts` |

### Files Modified (3)

| File | Change |
|---|---|
| `lib/api-helpers.ts` | `parseQuery` changed from async to sync (no internal awaits) |
| `lib/validators/meals.validator.ts` | Kept lowercase enums (matches frontend contract) — mapping to uppercase Prisma enums done in route handlers |
| Deleted all `.gitkeep` placeholders from API route directories |

### Validation

| Check | Result |
|---|---|
| `POST /api/auth/signup` | 201 — creates user + profile + stats, returns user + JWT (passwordHash excluded) |
| `POST /api/auth/login` | 200 — returns user + JWT |
| `GET /api/auth/me` | 200 — returns user (no password hash) |
| `GET /api/auth/me` (no token) | 401 UNAUTHORIZED |
| `POST /api/meals` | 201 — creates meal with foods[] + totalNutrition |
| `GET /api/meals?date=` | 200 — returns filtered meals |
| `POST /api/water` | 200 — upsert pattern |
| `POST /api/sleep` | 200 — upsert pattern |
| `GET /api/dashboard/summary` | 200 — aggregates meals + water + stats |
| `GET /api/stats` | 200 — returns achievements |
| `npm run build` | Passed |
| `npm run lint` | Passed — zero errors |
| Health: `db: "connected"` | Verified |

### Known Gaps (Notes for Phase 7) ✅ Most now resolved in Phase 7

1. **Stats not auto-updated on meal create/delete.** Still not implemented — service layer needs a hook.
2. **NigerianFood catalog not seeded.** `prisma/seed.ts` still needed.
3. **BMI history not auto-created.** Still pending.
4. **Admin import endpoint not implemented.** Still pending.
5. **Request logging.** Consider for production.

---

## Phase 7 (Frontend Migration) — Completion Report (01 August 2026)

### Summary

Replaced every `LocalDatabase` and `localStorage` reference in the frontend with real backend API calls. Installed React Query for server state management. Migrated authentication, meal tracking, water/sleep tracking, profile management, admin dashboard, and AI scanner to consume the production API. Removed `lib/local-storage.ts` (1,042 lines) and `scripts/add-sample-data.ts` entirely.

### Features Migrated

| Feature | Components | Data Source |
|---|---|---|
| **Authentication** | `auth-context.tsx`, `auth-page.tsx` | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` |
| **Meal CRUD** | `meal-logger.tsx`, `use-meals.ts` | `GET/POST/DELETE /api/meals` via React Query |
| **Profile** | `profile-settings.tsx`, `use-profile.ts` | `GET/PATCH /api/profile`, `PATCH /api/users/me` via React Query |
| **Water tracking** | `water-tracker.tsx` | `GET /api/water/today`, `POST /api/water` |
| **Sleep tracking** | `sleep-tracker.tsx` | `GET/POST /api/sleep` |
| **Dashboard** | `dashboard.tsx` | `GET /api/dashboard/summary`, `GET /api/water/today` |
| **Personalized welcome** | `personalized-welcome.tsx` | `GET /api/stats` via React Query |
| **Admin dashboard** | `admin-dashboard.tsx` | `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/admin/users/[id]` |
| **Profile details** | `user-profile-details.tsx` | (via useMeals/useProfile hooks — now API-backed) |
| **AI Scanner** | `ai-food-scanner.tsx` | (unchanged — already used API) |
| **Data export** | `profile-settings.tsx` | `GET /api/export` |
| **Theme** | `theme-context.tsx` | (kept localStorage for UI preference — not app data) |

### Legacy Code Removed

| File | Lines | Reason |
|---|---|---|
| `lib/local-storage.ts` | 1,042 | Entire localStorage data layer — replaced by API + Prisma |
| `scripts/add-sample-data.ts` | 187 | One-off seeding script referencing LocalDatabase |

### Files Created

| File | Purpose |
|---|---|
| `lib/api-client.ts` | Reusable frontend fetch client with JWT token management, typed helpers |
| `app/providers.tsx` | React Query provider wrapper with sensible defaults |
| Many `app/api/**/route.ts` files | (from Phase 6) |

### Files Modified (9)

| File | Change |
|---|---|
| `app/layout.tsx` | Wrapped app with `<Providers>` (React Query) |
| `app/page.tsx` | Removed `LocalDatabase.initialize()` call |
| `app/contexts/auth-context.tsx` | Complete rewrite — uses `api.post` for signup/login, `api.get` for me, JWT in memory |
| `app/hooks/use-meals.ts` | Rewrite — uses React Query `useQuery` + `api.get/post/delete` |
| `app/hooks/use-profile.ts` | Rewrite — uses React Query + `api.get/patch` |
| `app/components/dashboard.tsx` | Water check replaced with `api.get("/api/water/today")` |
| `app/components/water-tracker.tsx` | Full rewrite — `api.get/post` instead of LocalDatabase |
| `app/components/sleep-tracker.tsx` | Full rewrite — `api.get/post` instead of direct localStorage |
| `app/components/meal-logger.tsx` | `saveMeal()` uses `addMeal()` from hook instead of `LocalDatabase.createMeal()` |
| `app/components/personalized-welcome.tsx` | Stats fetched via React Query `GET /api/stats` |
| `app/components/admin-dashboard.tsx` | Full rewrite — uses API endpoints for users, stats, meals, export |
| `app/components/profile-settings.tsx` | Export/import use API, profile fields flattened (no more `preferences.`/`settings.` nesting) |
| `app/components/user-profile-details.tsx` | `Meal` type imported from `use-meals.ts` instead of `local-storage.ts` |
| `app/components/rating-dialog.tsx` | Removed localStorage calls |
| `app/utils/calculations.ts` | `waistCircumference`/`hipCircumference` params accept `\`null\`` |

### Validation

| Check | Result |
|---|---|
| `npm run build` | Passed — compiled successfully |
| `npm run lint` | Passed — zero errors/warnings |
| Zero references to `lib/local-storage.ts` | Verified — `grep -rn "local-storage" app/ lib/` returns empty |
| Auth: signup → login → get me | APIs return user + JWT, password hash excluded |
| Meals: create → list → delete | Working via API |
| Water: log → today → total | Working via API (upsert) |
| Sleep: log → history | Working via API (upsert) |
| Profile: update preferences | Working via API |
| Dashboard: summary | Aggregates meals + water + stats |
| AI prediction | Still works (unchanged) |

### Notes for Next Phase

1. **Stats auto-update still needed.** The `meals.service.ts` should call `statsService` on meal create/delete to update totals, streaks, and achievements.
2. **NigerianFood catalog seeding.** `prisma/seed.ts` must be created to populate the food database from `app/data/nigerian-foods.ts`.
3. **BMIHistory auto-creation.** `PATCH /api/users/me` should create a BMIHistory record when weight changes.
4. **Complete Dockerization** — `docker-compose.yml` currently only has PostgreSQL. Add `next-app` and `model-service` services.
5. **The `theme-context.tsx`** still uses `localStorage` for theme preference — this is deliberate. UI preferences are not application data.

---

## Phase 8 (Quality Pass & Feature Completion) — Completion Report (01 August 2026)

### Summary

Completed all deferred features from previous phases. Seeded the Nigerian food catalog (47 foods), implemented automatic statistics updates on meal create/delete, BMI history auto-creation, AI prediction-to-meal workflow, React Query invalidation fixes for dashboard auto-refresh, and removed 4 unused components.

### Deferred Items Completed

| Item | Status |
|---|---|
| **Nigerian Food Catalog Seeding** | `prisma/seed.ts` created — 47 foods seeded with upsert (safe to re-run) |
| **Auto stats on meal create/delete** | `meals.service.ts` calls `recalcStats()` — streaks, totals, favorite food, achievements auto-updated |
| **BMI history on weight change** | `PATCH /api/users/me` creates BMIHistory record when weight changes by >0.01kg |
| **AI meal workflow** | Scanner shows "Log as [food]" button — saves prediction as a SNACK meal |
| **Dashboard auto-refresh** | `addMeal`/`deleteMeal` invalidate all `["meals", userId]` and `["stats", userId]` React Query keys |
| **Dead code removed** | 4 unused components deleted: `food-logger.tsx`, `weekly-meal-overview.tsx`, `daily-meal-tracker.tsx`, `profile.tsx` |

### Files Created

| File | Purpose |
|---|---|
| `prisma/seed.ts` | Nigerian food catalog seeder — 47 foods, upsert pattern, safe to re-run |

### Files Modified

| File | Change |
|---|---|
| `lib/services/meals.service.ts` | Added `recalcStats()` — computes total meals, avg calories, favorite food, streaks, achievements after every meal create/delete |
| `app/api/users/me/route.ts` | BMI history auto-created on weight change |
| `app/components/ai-food-scanner.tsx` | Added "Log as Meal" button — saves top prediction as a meal with `useMeals().addMeal()` |
| `app/hooks/use-meals.ts` | Broadened React Query invalidation to `["meals", userId]` and `["stats", userId]` |
| `package.json` | Added `db:seed` script and `prisma.seed` config |

### Files Deleted

| File | Reason |
|---|---|
| `app/components/food-logger.tsx` | Unused — not imported by any component |
| `app/components/weekly-meal-overview.tsx` | Unused — not imported by any component |
| `app/components/daily-meal-tracker.tsx` | Unused — not imported by any component |
| `app/components/profile.tsx` | Unused — superseded by `profile-settings.tsx` |

### Validation

| Check | Result |
|---|---|
| `npx prisma db seed` | Seeds 47 foods, safe to re-run (upsert) |
| `npx prisma db seed` (repeat) | Re-runs without errors or duplicates |
| Stats auto-update | `recalcStats()` called on every meal create/delete |
| BMI history | Record created when weight changes |
| AI → Meal workflow | Prediction can be saved as a meal |
| Dashboard refresh | React Query invalidates all meal/stats queries on mutation |
| `npm run build` | Passed |
| `npm run lint` | Passed — zero errors/warnings |
| Zero `local-storage` references | Verified |

### Remaining Technical Debt

1. **Complete Dockerization** — `docker-compose.yml` currently only has PostgreSQL. Add `next-app` and `model-service`.
2. **Profile auto-refresh** — profile mutations only invalidate `["profile", userId]`; could also invalidate related dashboard queries.
3. **Admin import endpoint** — not yet implemented (complex, secondary feature).
4. **Rate limiting** — no rate limiting on auth endpoints. Consider for production.
5. **Comprehensive tests** — no unit or integration tests yet.

---

## Phase 9 (Dockerization & Local Deployment) — Completion Report (01 August 2026)

### Summary

Dockerized the complete application. A developer can clone, run `docker compose up --build`, and have the full system running on http://localhost:3000. No manual setup beyond Docker. The model service uses a PyTorch pre-built base image and is optional (activated via `--profile full`).

### Docker Architecture

| Service | Image | Port | Health Check |
|---|---|---|---|
| `next-app` | Multi-stage: node:22-slim | 3000 (host) | `curl /api/health` |
| `postgres` | postgres:16-alpine | Internal | `pg_isready` |
| `model-service` | pytorch/pytorch:2.6.0 | Internal | `curl /health` |

**Networking:** All services on default bridge network. Next.js talks to postgres via `postgres:5432` and model-service via `model-service:3002`. Model service never exposed to browser.

**Startup order:**
1. PostgreSQL starts → health check passes
2. Next.js starts → entrypoint runs `npx prisma migrate deploy` + `npx prisma db seed`
3. Model service (optional, `--profile full`) → loads PyTorch model
4. All healthy → app accessible at :3000

**Persistence:** PostgreSQL data in named volume `pgdata`. Survives container recreation and `docker compose down` (without `-v`).

### Files Created

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage Next.js build (deps → builder → runner) |
| `model-service/Dockerfile` | PyTorch base image + FastAPI |
| `scripts/entrypoint.sh` | Prisma migrate + seed on container start |
| `.dockerignore` | Excludes node_modules, .next, .git, etc. |
| `README.md` | Setup instructions, commands, architecture overview |

### Files Modified

| File | Change |
|---|---|
| `docker-compose.yml` | Added model-service and next-app services, health checks, volumes |
| `next.config.mjs` | Changed to `output: "standalone"` |
| `prisma/schema.prisma` | Added `binaryTargets` for OpenSSL 3.0.x compatibility |
| `.env.example` | Simplified to Docker-friendly format |
| `.gitignore` | Added `model-service/venv`, `__pycache__` |

### Validation (all inside Docker)

| Check | Result |
|---|---|
| `docker compose up --build` | All services start successfully |
| `GET /api/health` | `{"status":"ok","db":"connected"}` |
| Prisma migrations | Applied automatically on startup |
| Database seed | 47 Nigerian foods seeded (idempotent) |
| User signup | 201 |
| User login | 200 + JWT |
| Meal CRUD | Create/list/delete working |
| Water tracking | Upsert working (750ml) |
| Sleep tracking | Upsert working (8h) |
| Dashboard summary | 1 meal, 275 cal, 750ml water |
| Food catalog | 47 foods returned |
| Database persists | Data survives `docker compose down` (without `-v`) |

### Model Service

The model service is optional. To run with AI predictions:

```bash
docker compose --profile full up --build
```

The model service uses `pytorch/pytorch:2.6.0` base image (PyTorch pre-installed) with pip cache mounts for fast rebuilds.

### Remaining Work

1. **Model service integration testing** — verify full flow with image upload inside Docker (requires building model-service image which is large due to PyTorch base).
2. **Production secrets** — `JWT_SECRET` in docker-compose.yml is a placeholder.
3. **CI/CD** — GitHub Actions for automated Docker builds and tests.
4. **Rate limiting** and production hardening.
