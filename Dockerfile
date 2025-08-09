# Multi-stage build for production optimization and security
# Using Node.js 24.5 Alpine for the latest features and security patches

# Dependencies stage - install all dependencies at root level
FROM node:24.5-alpine AS dependencies

# Install security updates
RUN apk update && apk upgrade

WORKDIR /app

# Copy root package.json and package-lock.json
COPY package*.json ./

# Copy workspace package files
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies using npm workspaces
RUN npm ci && npm cache clean --force

# Frontend build stage
FROM node:24.5-alpine AS frontend-build

# Install security updates
RUN apk update && apk upgrade

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/frontend/node_modules ./frontend/node_modules

# Copy root package files
COPY package*.json ./

# Copy frontend source and shared modules
COPY frontend/ ./frontend/
COPY shared/ ./shared/

# Set build-time environment variables for frontend build
ENV VITE_API_URL=/receipts/api
ENV VITE_BASE_PATH=/receipts

# Build frontend with optimizations
WORKDIR /app/frontend
RUN npm run build

# Backend build stage  
FROM node:24.5-alpine AS backend-build

# Install security updates
RUN apk update && apk upgrade

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/backend/node_modules ./backend/node_modules

# Copy root package files
COPY package*.json ./

# Copy backend source and shared types
COPY backend/ ./backend/
COPY shared/ ./shared/

# Build backend
WORKDIR /app/backend
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

# Copy root package files and install production dependencies using workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install production dependencies at root level using npm workspaces
RUN npm ci --omit=dev && npm cache clean --force

# Copy built backend and frontend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy the built shared types
COPY shared/ ./shared/

# Set frontend dist path for static serving
ENV FRONTEND_DIST_PATH=/app/frontend/dist

# Create directories and set permissions in one layer
RUN mkdir -p uploads logs data && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the backend port (configurable via environment)
ARG PORT=3001
EXPOSE $PORT

# Health check using Node.js with configurable port
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const port=process.env.PORT||3001; require('http').get(\`http://localhost:\${port}/api/health\`, (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the backend server from the correct path
CMD ["node", "backend/dist/backend/src/index.js"]
