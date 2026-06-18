# frontend/Dockerfile
# 1. Base Node image
FROM node:18-alpine AS base

# 2. Build the source code
FROM base AS builder
WORKDIR /app

# Copy ALL dependency files (lock file ensures reproducible installs)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy ALL Next.js config and source files
COPY next.config.js tsconfig.json postcss.config.mjs ./
COPY src ./src

# Copy public assets if they exist (Next.js static files)
COPY public ./public 2>/dev/null || true

# Declare build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js app (standalone output for Cloud Run)
RUN npm run build

# 3. Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only what's needed to run the app
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

USER nextjs

EXPOSE 3000

CMD ["npx", "next", "start"]
