# 1. Base image with common system dependencies for Remotion
FROM node:20-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache \
    ffmpeg \
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
RUN npm ci --ignore-scripts

# 3. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client (force binary target for linux-musl-openssl-3.0.x if needed, but usually auto-detected)
RUN npx prisma generate
RUN npm run build
RUN npm run build:worker

# 4. Final runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd --gid 1001 nodejs
RUN useradd --uid 1001 --gid 1001 -m nextjs

# Copy web files from standalone build (includes server.js and node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy worker and prisma files
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
