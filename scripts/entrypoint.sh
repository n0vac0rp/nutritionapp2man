#!/bin/sh
set -e

echo "Running Prisma migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Checking if NigerianFood catalog is already seeded..."
if npx tsx scripts/check-seeded.ts; then
  echo "Database already seeded, skipping."
else
  echo "Running Prisma seed (idempotent upserts)..."
  npx prisma db seed
fi

echo "Starting Next.js..."
exec "$@"