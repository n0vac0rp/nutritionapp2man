# GluGuide — Smart Nutrition Monitoring System

Nigerian nutrition tracking app with AI food classification.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

## Quick Start

```bash
git clone <repo-url> && cd nutritionapp2man
docker compose up --build
```

Open http://localhost:3000

**Demo credentials:**
- User: sign up via the registration form
- Admin: sign up and set role via database

## Architecture

| Service | Port | Tech |
|---|---|---|
| `next-app` | 3000 | Next.js 15 (frontend + API) |
| `postgres` | 5432 (internal) | PostgreSQL 16 |
| `model-service` | 3002 (internal) | FastAPI + PyTorch |

## Commands

```bash
# Start
docker compose up --build

# Start in background
docker compose up -d --build

# Stop
docker compose down

# Stop and delete database
docker compose down -v

# Rebuild after code changes
docker compose build next-app && docker compose up -d

# View logs
docker compose logs -f next-app

# Run migrations manually
docker compose exec next-app npx prisma migrate deploy

# Reseed database
docker compose exec next-app npx prisma db seed

# Inspect database
docker compose exec postgres psql -U gluguide_user -d gluguide
```

## Environment

Copy variables from `docker-compose.yml` as needed. The defaults work for Docker.

Key variables:
- `DATABASE_URL` — PostgreSQL connection
- `JWT_SECRET` — change for production
- `MODEL_SERVICE_URL` — FastAPI model service

## API

All endpoints under `/api/*`. See `docs/backend-contract.md` for full specification.

Health check: `GET /api/health`
