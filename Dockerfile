# 1. Base image with common system dependencies for Remotion
FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
# Install Chromium and FFmpeg (Essential for Remotion)
RUN apk add --no-cache \
    ffmpeg \
    openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libstdc++ \
    chromium-chromedriver

# 2. Dependencies stage (cached)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
# Install dependencies including devDeps for build
RUN npm ci

# 3. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js and Worker
RUN npm run build:worker
RUN npm run build

# 4. Final runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy web files from standalone build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy artifacts needed for runtime (Bundled Remotion, Worker, Prisma)
COPY --from=builder --chown=nextjs:nodejs /app/out ./out
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Boot the unified application (Web + Internal Scheduler + Workers)
CMD ["node", "server.js"]
