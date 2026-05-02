# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install deps
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Set dummy env vars for build (real ones come from Cloud Run env)
ENV NEXT_PUBLIC_FIREBASE_API_KEY=build-placeholder
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=build-placeholder
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=build-placeholder
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=build-placeholder
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=build-placeholder
ENV NEXT_PUBLIC_FIREBASE_APP_ID=build-placeholder
ENV NEXT_PUBLIC_FIREBASE_DATABASE_URL=build-placeholder

# Build Next.js
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public 2>/dev/null || true

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
