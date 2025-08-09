# Docker-based Local Production Testing Guide

This guide walks you through testing the Recipix deployment locally using Docker, which provides a more accurate simulation of the production environment.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)
- At least 2GB free disk space for the Docker image

## Quick Start

### 1. Build and Start with Docker

```bash
# Build Docker image and start services
npm run docker:build:local
```

This will:
- Build the production Docker image
- Start the container with production settings
- Initialize the database
- Make the application available at http://localhost:3001/receipts

### 2. Alternative: Manual Docker Management

If you prefer step-by-step control:

```bash
# Build the Docker image
docker build -t recipix:local-prod .

# Start with Docker Compose
docker-compose -f docker-compose.local.yml up -d

# Or start directly with Docker
docker run -d \
  --name recipix-local-prod \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PUBLIC_BASE_PATH=/receipts \
  -e API_BASE_URL=http://localhost:3001/receipts/api \
  recipix:local-prod
```

## Management Commands

### Docker Service Management

```bash
# Start services
npm run docker:start

# Stop services
npm run docker:stop

# Restart services
npm run docker:restart

# Rebuild image and restart
npm run docker:rebuild

# Check status
npm run docker:status

# View logs
npm run docker:logs

# Follow logs in real-time
npm run docker:follow
```

### Manual Docker Commands

```bash
# View container status
docker ps

# View logs
docker logs recipix-local-prod

# Execute commands inside container
docker exec -it recipix-local-prod sh

# Stop and remove container
docker stop recipix-local-prod && docker rm recipix-local-prod

# Remove image
docker rmi recipix:local-prod
```

## Testing URLs

Once the container is running, test these endpoints:

- **Frontend**: http://localhost:3001/receipts
- **API Health**: http://localhost:3001/receipts/api/health
- **API Base**: http://localhost:3001/receipts/api
- **Auth Endpoint**: http://localhost:3001/receipts/api/auth

## Environment Configuration

The Docker container uses production-like environment variables:

```env
NODE_ENV=production
PORT=3001
PUBLIC_BASE_PATH=/receipts
API_BASE_URL=http://localhost:3001/receipts/api
FRONTEND_URL=http://localhost:3001/receipts
CORS_ORIGIN=http://localhost:3001
DATABASE_PATH=/app/data/recipix.db
UPLOAD_DIR=/app/uploads
```

## Verification Checklist

### ✅ Container Health
- [ ] Container starts without errors
- [ ] Health check passes (`docker ps` shows "healthy")
- [ ] No critical errors in logs

### ✅ Frontend Verification
- [ ] Frontend loads at `/receipts` path
- [ ] Assets load correctly (CSS, JS, images)
- [ ] PWA manifest is accessible
- [ ] Service worker registers correctly
- [ ] Dark/light theme switching works

### ✅ Backend API Verification
- [ ] Health endpoint responds: `curl http://localhost:3001/receipts/api/health`
- [ ] Database is initialized (check logs for migration messages)
- [ ] CORS headers are present
- [ ] Security headers are included

### ✅ Integration Testing
- [ ] User registration works
- [ ] Login/logout functionality
- [ ] File upload (test with a small image)
- [ ] API error handling
- [ ] Base path routing works correctly

## Troubleshooting

### Container Won't Start

```bash
# Check Docker daemon
docker info

# View build logs
docker build -t recipix:local-prod . --no-cache

# Check container logs
docker logs recipix-local-prod

# Check port conflicts
lsof -i :3001
```

### Frontend Issues

```bash
# Inspect the built frontend files
docker exec -it recipix-local-prod ls -la /app/frontend/dist

# Check nginx configuration (if using nginx)
docker exec -it recipix-local-prod cat /etc/nginx/nginx.conf

# Test API connectivity from inside container
docker exec -it recipix-local-prod curl http://localhost:3001/receipts/api/health
```

### Database Issues

```bash
# Check database file
docker exec -it recipix-local-prod ls -la /app/data/

# Check database tables
docker exec -it recipix-local-prod sqlite3 /app/data/recipix.db ".tables"

# View migration status
docker exec -it recipix-local-prod npm run --prefix backend db:status
```

### Performance Issues

```bash
# Check resource usage
docker stats recipix-local-prod

# View system resources
docker exec -it recipix-local-prod top

# Check disk usage
docker exec -it recipix-local-prod df -h
```

## Cleanup

### Remove Everything

```bash
# Stop and remove containers
npm run docker:stop
docker-compose -f docker-compose.local.yml down --volumes

# Remove images
docker rmi recipix:local-prod

# Remove unused Docker resources
docker system prune -a
```

### Reset Data Only

```bash
# Remove volumes (keeps image)
docker-compose -f docker-compose.local.yml down --volumes
```

## Production Differences

This local Docker setup simulates production but has these differences:

| Aspect | Local Docker | Production |
|--------|-------------|------------|
| SSL/TLS | HTTP only | HTTPS with certificates |
| Reverse Proxy | Direct access | Nginx reverse proxy |
| Secrets | Environment variables | Docker secrets/K8s secrets |
| Scaling | Single container | Multiple containers/replicas |
| Monitoring | Basic health checks | Full monitoring stack |
| Backups | Manual | Automated backup system |

## Next Steps

Once local Docker testing passes:

1. **Deploy to staging**: Use the same Docker image in staging environment
2. **Update production config**: Adjust environment variables for production
3. **Set up monitoring**: Add logging and monitoring solutions
4. **Configure SSL**: Set up SSL certificates and HTTPS
5. **Set up CI/CD**: Automate the build and deployment process

## Tips

- Always test with a clean Docker environment to catch dependency issues
- Monitor resource usage to optimize for production deployment
- Test the health check endpoint thoroughly as it's used for orchestration
- Verify all environment variables work as expected
- Test file upload/download functionality with various file types
