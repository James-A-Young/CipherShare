# ============================================
# Build Stage - Frontend
# ============================================
FROM node:24-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code (frontend)
COPY src ./src
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY postcss.config.js ./

# Build frontend only (skip server build here; server handled in backend-builder stage)
RUN npm run build:client

# ============================================
# Build Stage - Backend
# ============================================
FROM node:24-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY package-lock.json ./

# Install dependencies (including dev for TypeScript compilation)
RUN npm ci --ignore-scripts

# Copy server source
COPY server ./server
COPY tsconfig.server.json ./

# Compile TypeScript to JavaScript
RUN npx tsc -p tsconfig.server.json

# ============================================
# Production Stage
# ============================================
FROM node:24-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --ignore-scripts --omit=dev && \
    npm cache clean --force

# Copy built frontend from builder
COPY --from=frontend-builder /app/dist ./dist

# Copy compiled backend from builder
COPY --from=backend-builder /app/server-dist ./server-dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server-dist/index.js"]
