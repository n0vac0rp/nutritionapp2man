#!/bin/sh
set -e

echo "Running Prisma migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Seeding database..."
npx prisma db seed

echo "Database initialized."
