# Stage 1: Build the frontend SPA
FROM node:22-alpine AS builder

WORKDIR /app

# Install native build tools for compiling better-sqlite3 if needed
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production
ENV PORT=5000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy server code and database migrations/schema
COPY server ./server
COPY tsconfig.json ./

# Copy compiled frontend assets from builder
COPY --from=builder /app/dist ./dist

# Create persistent data volume mount point for SQLite database
RUN mkdir -p /app/data

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

VOLUME ["/app/data"]

CMD ["npm", "run", "start"]
