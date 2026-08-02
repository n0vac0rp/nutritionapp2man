#!/bin/sh
set -e

echo "Running Prisma migrations..."
node node_modules/prisma/build/index.js migrate deploy

if [ -f prisma/seed.mjs ]; then
  COUNT=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.nigerianFood.count().then(function(c) { process.exit(c > 0 ? 0 : 1); });
  " 2>/dev/null && echo "seeded" || echo "empty")

  if [ "$COUNT" = "empty" ]; then
    echo "Seeding database..."
    node prisma/seed.mjs
  else
    echo "Database already seeded, skipping."
  fi
else
  echo "Seed script not found, skipping."
fi

echo "Starting Next.js..."
exec "$@"
