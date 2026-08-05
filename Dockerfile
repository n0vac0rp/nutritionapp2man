FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; else npm install --legacy-peer-deps; fi

FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-slim AS runner
RUN apt-get update -y && apt-get install -y curl openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./
RUN npm install --no-save --legacy-peer-deps prisma tsx @prisma/adapter-pg pg dotenv
COPY scripts/entrypoint.sh ./entrypoint.sh
COPY scripts/check-seeded.ts ./scripts/check-seeded.ts
RUN chmod +x entrypoint.sh && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
