# Multi-stage build for production optimization and security
# Using Node.js 24.5 Alpine for the latest features and security patches

# Frontend build stage
FROM node:24.5-alpine AS frontend-build

# Install security updates
RUN apk update && apk upgrade

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install all dependencies including dev dependencies for build
RUN npm install && npm cache clean --force

# Copy frontend source and shared modules
COPY frontend/ ./
COPY shared/ ../shared/

# Set build-time environment variables for frontend build
ENV VITE_API_URL=/receipts/api
ENV VITE_BASE_PATH=/receipts

# Build frontend with optimizations
RUN npm run build

# Backend build stage  
FROM node:24.5-alpine AS backend-build

# Install security updates
RUN apk update && apk upgrade

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install all dependencies including dev dependencies for build
RUN npm install && npm cache clean --force

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

# Copy backend package.json and install production dependencies only
COPY --from=backend-build /app/backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --omit=dev && npm cache clean --force
WORKDIR /app

# Copy built backend
COPY --from=backend-build /app/backend/dist ./backend/dist

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

# Set working directory to backend where node_modules are installed
WORKDIR /app/backend

# Start the backend server
CMD ["node", "dist/backend/src/index.js"]
