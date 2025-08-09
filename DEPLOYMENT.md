# Recipix Production Deployment Guide

This guide provides comprehensive instructions for deploying Recipix in a production environment with proper security, scalability, and maintainability.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Security Configuration](#security-configuration)
4. [Deployment Process](#deployment-process)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Maintenance](#maintenance)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ or CentOS 8+ recommended)
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Nginx**: Version 1.18+ (for reverse proxy)
- **RAM**: Minimum 1GB, Recommended 2GB+
- **Storage**: Minimum 10GB, Recommended 50GB+
- **CPU**: Minimum 1 core, Recommended 2+ cores

### Software Dependencies

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt update
sudo apt install nginx

# Install OpenSSL for key generation
sudo apt install openssl
```

## Environment Configuration

### 1. Base Path Configuration

The application supports flexible deployment paths:

```bash
# Example for deployment at https://example.com/receipts
APP_BASE_PATH=/my-path/fintools          # Host filesystem path
PUBLIC_BASE_PATH=/receipts               # URL path prefix
API_BASE_URL=https://example.com/receipts/api
FRONTEND_URL=https://example.com/receipts
```

### 2. Port Configuration

```bash
BACKEND_PORT=3001    # Internal container port
HOST_PORT=8080       # External host port (for nginx proxy)
```

### 3. Environment Variables

Copy and customize the environment file:

```bash
cp .env.production .env
```

**Critical variables to customize:**

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | JWT token signing key | Generated automatically |
| `SESSION_SECRET` | Session encryption key | Generated automatically |
| `FRONTEND_URL` | Public frontend URL | `https://example.com/receipts` |
| `API_BASE_URL` | Public API URL | `https://example.com/receipts/api` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://example.com` |
| `APP_BASE_PATH` | Host filesystem path | `/my-path/fintools` |

## Security Configuration

### 1. Secrets Generation

The deployment script automatically generates secure secrets:

```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Generate session secret  
SESSION_SECRET=$(openssl rand -base64 32)
```

### 2. Database Security

For SQLite (default):
```bash
DB_TYPE=sqlite
DB_FILE_PATH=/app/data/recipix.db
```

For PostgreSQL (recommended for production):
```bash
DB_TYPE=postgresql
DB_HOST=your-secure-database-host
DB_PORT=5432
DB_NAME=recipix
DB_USER=recipix_user
DB_PASSWORD=very_secure_database_password
```

### 3. File Permissions

The application runs as a non-root user (`nextjs:nodejs`) with UID/GID 1001:

```bash
# Host directories should be owned by user with matching UID
sudo chown -R 1001:1001 /my-path/fintools/
```

### 4. Container Security

The Docker configuration includes:

- Non-root user execution
- Read-only filesystem where possible
- Resource limits
- Security options (`no-new-privileges`)
- Minimal Alpine Linux base image
- Regular security updates

## Deployment Process

### 1. Automated Deployment

Use the provided deployment script:

```bash
# Clone the repository
git clone <repository-url>
cd recipix

# Run deployment script
./deploy.sh
```

### 2. Manual Deployment

```bash
# 1. Prepare environment
cp .env.production .env
# Edit .env with your configuration

# 2. Create directories
mkdir -p /my-path/fintools/{uploads,logs,database}

# 3. Build and start
docker-compose build --no-cache
docker-compose up -d

# 4. Verify deployment
docker-compose ps
docker-compose logs -f
```

### 3. Verification

```bash
# Check application health
curl http://localhost:8080/receipts/api/health

# Check container status
docker-compose ps

# View logs
docker-compose logs recipix
```

## Nginx Configuration

### 1. Basic Configuration

Create `/etc/nginx/sites-available/fintools-receipts`:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name example.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    # Recipix application
    location /receipts {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload size
        client_max_body_size 10M;
    }
}
```

### 2. Enable Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fintools-receipts /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## SSL/TLS Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d example.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Custom Certificate

```bash
# If you have your own certificate
sudo cp your-certificate.crt /etc/ssl/certs/
sudo cp your-private.key /etc/ssl/private/
sudo chmod 600 /etc/ssl/private/your-private.key
```

## Monitoring and Logging

### 1. Application Logs

```bash
# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs recipix

# Log files location
tail -f /my-path/fintools/logs/application.log
```

### 2. Health Monitoring

```bash
# Health check endpoint
curl https://example.com/receipts/api/health

# Container health status
docker-compose ps
```

### 3. Log Rotation

Create `/etc/logrotate.d/recipix`:

```
/my-path/fintools/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 1001 1001
    postrotate
        docker-compose restart recipix > /dev/null 2>&1 || true
    endscript
}
```

## Backup and Recovery

### 1. Database Backup

For SQLite:
```bash
# Backup database
cp /my-path/fintools/database/recipix.db /backup/recipix-$(date +%Y%m%d).db

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/recipix"
mkdir -p $BACKUP_DIR
cp /my-path/fintools/database/recipix.db "$BACKUP_DIR/recipix-$(date +%Y%m%d-%H%M%S).db"
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
```

### 2. File Uploads Backup

```bash
# Backup uploads
tar -czf /backup/recipix-uploads-$(date +%Y%m%d).tar.gz /my-path/fintools/uploads
```

### 3. Configuration Backup

```bash
# Backup configuration
cp .env /backup/recipix-env-$(date +%Y%m%d).backup
```

## Maintenance

### 1. Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 2. Security Updates

```bash
# Update base images
docker-compose pull
docker-compose up -d --force-recreate

# Update system packages
sudo apt update && sudo apt upgrade
```

### 3. Log Cleanup

```bash
# Clean Docker logs
docker system prune -a

# Clean application logs (automated via logrotate)
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check logs
docker-compose logs recipix

# Check environment variables
docker-compose config

# Verify file permissions
ls -la /my-path/fintools/
```

#### 2. Nginx 502 Bad Gateway

```bash
# Check if application is running
curl http://localhost:8080/receipts/api/health

# Check nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 3. File Upload Issues

```bash
# Check upload directory permissions
ls -la /my-path/fintools/uploads/

# Check nginx file size limit
grep client_max_body_size /etc/nginx/sites-enabled/*

# Check application logs for upload errors
docker-compose logs recipix | grep -i upload
```

#### 4. Database Issues

```bash
# Check database file permissions
ls -la /my-path/fintools/database/

# Check database connectivity
docker-compose exec recipix node -e "
const db = require('./backend/dist/database/connection');
console.log('Database connection:', db.isHealthy());
"
```

### Performance Optimization

#### 1. Resource Limits

Adjust in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '1.0'
    reservations:
      memory: 512M
      cpus: '0.5'
```

#### 2. Nginx Caching

Add to nginx configuration:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Security Hardening

#### 1. Firewall Configuration

```bash
# UFW example
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 8080  # Block direct access to application
sudo ufw enable
```

#### 2. Fail2Ban

```bash
# Install fail2ban
sudo apt install fail2ban

# Configure for nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
# Edit jail.local to enable nginx protection
```

## Support

For additional support:

1. Check the application logs: `docker-compose logs -f`
2. Review this documentation
3. Check the project repository for updates
4. Ensure all environment variables are properly configured

---

**Security Note**: Always keep your system updated, use strong passwords, enable SSL/TLS, and regularly backup your data.
