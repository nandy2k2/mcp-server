# ─── Stage 1: build / install deps ──────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install production deps only
RUN npm ci --omit=dev

# ─── Stage 2: runtime image ──────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy only what is needed
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js    ./
COPY index.js     ./

# Azure App Service / Container Apps sets PORT automatically
EXPOSE 8000

# Health check (Azure uses this too)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-8000}/health || exit 1

# Run the HTTP server (not the stdio one)
CMD ["node", "server.js"]
