FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; else npm install --legacy-peer-deps; fi

FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npx esbuild prisma/seed.ts --bundle --platform=node --target=node22 --outfile=prisma/seed.mjs --format=esm --external:@prisma/client
RUN npm run build

FROM node:22-slim AS runner
RUN apt-get update -y && apt-get install -y curl openssl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package.json ./
RUN npm install --no-save --legacy-peer-deps prisma
COPY scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh && chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
