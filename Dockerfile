# Multi-stage build for production optimization and security
# Using Node.js 20 Alpine for the latest features and security patches

# Arguments for build-time configuration
ARG PUBLIC_BASE_PATH=/receipts
ARG API_BASE_URL=http://localhost:3001/api

# Frontend build stage
FROM node:24.5-alpine AS frontend-build

# Install security updates
RUN apk update && apk upgrade

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies with clean cache
RUN npm ci --only=production && npm cache clean --force

# Copy frontend source
COPY frontend/ ./

# Set build-time environment variables
ENV PUBLIC_BASE_PATH=$PUBLIC_BASE_PATH
ENV API_BASE_URL=$API_BASE_URL

# Build frontend with optimizations
RUN npm run build

# Backend build stage  
FROM node:24.5-alpine AS backend-build

# Install security updates
RUN apk update && apk upgrade

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies with clean cache
RUN npm ci --only=production && npm cache clean --force

# Copy backend source and shared types
COPY backend/ ./
COPY shared/ ../shared/

# Build backend
RUN npm run build

# Production stage
FROM node:24.5-alpine AS production

# Install security updates and required system dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    curl \
    imagemagick \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    tesseract-ocr-data-por \
    tini && \
    rm -rf /var/cache/apk/*

# Create app directory and user in one layer
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy shared types
COPY shared/ ./shared/

# Create directories and set permissions in one layer
RUN mkdir -p uploads logs data && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose only the backend port (frontend is served by backend in production)
EXPOSE 3001

# Health check using Node.js instead of curl for better security
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the backend server
CMD ["node", "backend/dist/index.js"]
