# Docker Production Deployment Guide

## Overview

CipherShare can be deployed as a single Docker container (excluding Redis) for production use. This guide covers building, deploying, and managing the containerized application.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 24 LTS (for local testing)
- 2GB RAM minimum
- 10GB disk space minimum

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Host                     │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  ciphershare-app-prod            │  │
│  │  (Node.js 24 Alpine)             │  │
│  │  - Express Backend               │  │
│  │  - Static Frontend               │  │
│  │  - Health Checks                 │  │
│  │  Port: 3001                      │  │
│  └──────────────────────────────────┘  │
│               │                         │
│               │ Internal Network        │
│               ▼                         │
│  ┌──────────────────────────────────┐  │
│  │  ciphershare-redis-prod          │  │
│  │  (Redis 7 Alpine)                │  │
│  │  - Persistent Storage            │  │
│  │  - Password Protected            │  │
│  │  Port: 6379                      │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Multi-Stage Docker Build

The Dockerfile uses a multi-stage build for optimization:

1. **Frontend Builder** - Compiles React app with Vite
2. **Backend Builder** - Compiles TypeScript server to JavaScript
3. **Production** - Minimal Alpine image with compiled assets

### Benefits

- **Smaller Image**: ~200MB vs ~1GB+ with dev dependencies
- **Security**: No source code or dev tools in final image
- **Performance**: Pre-compiled, optimized production build
- **Fast Startup**: No compilation at runtime

## Quick Start

### 1. Configure Environment

```bash
# Copy production environment template
cp .env.prod.example .env.prod

# Edit with your values
nano .env.prod
```

**Required Configuration**:

```env
# Generate secure Redis password
REDIS_PASSWORD=$(openssl rand -base64 32)

# Generate system encryption key (64 hex chars)
SYSTEM_SECRET_KEY=$(openssl rand -hex 32)

# Email provider setup
EMAIL_PROVIDER=sendgrid  # or mailgun
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=your_sendgrid_key

# Application URL
CLIENT_URL=https://yourdomain.com
```

### 2. Build and Deploy

```bash
# Build the Docker image
npm run docker:build

# Or use docker-compose (builds automatically)
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Verify Deployment

```bash
# Check container status
docker ps

# View logs
npm run docker:logs

# Test health endpoint
curl http://localhost:3001/api/health
```

Expected response:

```json
{ "status": "ok", "timestamp": "2025-11-18T..." }
```

## Docker Compose Production

### Starting Services

```bash
# Start in detached mode
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Follow specific service logs
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f redis
```

### Stopping Services

```bash
# Stop containers (keeps data)
docker-compose -f docker-compose.prod.yml stop

# Stop and remove containers (keeps volumes)
docker-compose -f docker-compose.prod.yml down

# Stop and remove everything including volumes (⚠️ DATA LOSS)
docker-compose -f docker-compose.prod.yml down -v
```

### Updating Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Or using npm scripts
npm run docker:build
npm run docker:stop
npm run docker:run
```

## Manual Docker Commands

### Build Image

```bash
# Build with tag
docker build -t ciphershare:latest .

# Build specific stage
docker build --target production -t ciphershare:prod .

# Build with build args
docker build --build-arg NODE_VERSION=24 -t ciphershare:latest .
```

### Run Container

```bash
# Run with environment file
docker run -d \
  --name ciphershare-app \
  --env-file .env.prod \
  -p 3001:3001 \
  --network ciphershare-network \
  ciphershare:latest

# Run with inline environment variables
docker run -d \
  --name ciphershare-app \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  -e SYSTEM_SECRET_KEY=your_key \
  -p 3001:3001 \
  ciphershare:latest
```

### Inspect Container

```bash
# View logs
docker logs ciphershare-app
docker logs -f ciphershare-app  # Follow logs

# Execute commands in container
docker exec -it ciphershare-app sh

# Check resource usage
docker stats ciphershare-app

# Inspect container details
docker inspect ciphershare-app
```

## Health Checks

### Container Health

The Docker image includes built-in health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', ...)"
```

### Manual Health Verification

```bash
# Check from host
curl http://localhost:3001/api/health

# Check from inside container
docker exec ciphershare-app wget -qO- http://localhost:3001/api/health

# View health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Health Check Endpoint

```http
GET /api/health HTTP/1.1
Host: localhost:3001

Response: 200 OK
{
  "status": "ok",
  "timestamp": "2025-11-18T10:30:00.000Z",
  "redis": "connected",
  "uptime": 3600
}
```

## Volumes and Data Persistence

### Redis Data Volume

Redis data is persisted in a named Docker volume:

```bash
# List volumes
docker volume ls

# Inspect redis volume
docker volume inspect ciphershare_redis-data

# Backup redis data
docker run --rm \
  -v ciphershare_redis-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/redis-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restore redis data
docker run --rm \
  -v ciphershare_redis-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/redis-backup-YYYYMMDD.tar.gz -C /data
```

## Security Considerations

### Container Security

The production container runs with several security enhancements:

1. **Non-Root User**: Application runs as user `nodejs` (UID 1001)
2. **Read-Only**: Minimal write access (tmpfs for /tmp)
3. **No New Privileges**: Prevents privilege escalation
4. **Minimal Base**: Alpine Linux reduces attack surface
5. **No Dev Tools**: Production image contains no compilers/debuggers

### Network Security

```bash
# Isolated network
docker network create ciphershare-network

# Redis only accessible from app container
docker network inspect ciphershare-network
```

### Secrets Management

**DO NOT** commit sensitive values to version control:

```bash
# Add to .gitignore
echo ".env.prod" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.key" >> .gitignore
```

**Use External Secrets Management**:

- Docker Secrets (Swarm mode)
- Kubernetes Secrets
- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault

Example with Docker Secrets:

```bash
# Create secrets
echo "my_redis_password" | docker secret create redis_password -
echo "my_system_key" | docker secret create system_key -

# Reference in docker-compose.yml
services:
  app:
    secrets:
      - redis_password
      - system_key
    environment:
      REDIS_PASSWORD_FILE: /run/secrets/redis_password
      SYSTEM_SECRET_KEY_FILE: /run/secrets/system_key
```

## Resource Limits

### Setting Limits in Docker Compose

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M

  redis:
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
```

### Setting Limits with Docker Run

```bash
docker run -d \
  --name ciphershare-app \
  --memory="512m" \
  --memory-swap="512m" \
  --cpus="1.0" \
  ciphershare:latest
```

## Monitoring and Logging

### Log Management

Configure log rotation in docker-compose.prod.yml:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### View Logs

```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100

# Logs since timestamp
docker-compose -f docker-compose.prod.yml logs --since 2025-11-18T10:00:00

# Export logs
docker-compose -f docker-compose.prod.yml logs > ciphershare-logs.txt
```

### Monitoring Tools

**Container Metrics**:

```bash
# Basic stats
docker stats ciphershare-app ciphershare-redis

# Prometheus + Grafana (recommended)
# Add monitoring services to docker-compose.yml
```

**External Monitoring**:

- Datadog
- New Relic
- Prometheus + Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)

## Production Optimizations

### Environment Variables

```env
# Production mode
NODE_ENV=production

# Memory optimization
NODE_OPTIONS=--max-old-space-size=512

# Performance tuning
UV_THREADPOOL_SIZE=8
```

### Redis Configuration

```bash
# Optimize Redis in docker-compose.prod.yml
command: >
  redis-server
  --appendonly yes
  --appendfsync everysec
  --maxmemory 256mb
  --maxmemory-policy allkeys-lru
  --requirepass ${REDIS_PASSWORD}
```

### Rate Limiting

Rate limits are built into the application. For additional protection, use a reverse proxy:

**Nginx Example**:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:3001;
}
```

## Reverse Proxy Setup

### Nginx Configuration

```nginx
upstream ciphershare {
    server localhost:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        proxy_pass http://ciphershare;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://ciphershare;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Traefik Configuration

```yaml
# docker-compose.prod.yml with Traefik
version: "3.8"

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@yourdomain.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - traefik-letsencrypt:/letsencrypt

  app:
    image: ciphershare:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ciphershare.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.ciphershare.entrypoints=websecure"
      - "traefik.http.routers.ciphershare.tls.certresolver=letsencrypt"
      - "traefik.http.services.ciphershare.loadbalancer.server.port=3001"
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs ciphershare-app

# Common issues:
# 1. Missing environment variables
docker exec ciphershare-app env | grep -E "REDIS|SYSTEM|EMAIL"

# 2. Port already in use
lsof -i :3001
docker ps -a | grep 3001

# 3. Redis connection failed
docker exec ciphershare-app ping redis
```

### High Memory Usage

```bash
# Check current usage
docker stats --no-stream ciphershare-app

# Set memory limit
docker update --memory="512m" ciphershare-app

# Restart container
docker restart ciphershare-app
```

### Redis Connection Issues

```bash
# Test Redis connectivity
docker exec ciphershare-app nc -zv redis 6379

# Check Redis auth
docker exec ciphershare-redis redis-cli -a "$REDIS_PASSWORD" ping

# View Redis logs
docker logs ciphershare-redis
```

### Build Failures

```bash
# Clean build cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache -t ciphershare:latest .

# Check build logs
docker build -t ciphershare:latest . 2>&1 | tee build.log
```

## Scaling Considerations

### Single Server

Current setup is optimized for single-server deployment:

- In-memory rate limiting (per container)
- Single Redis instance
- Direct container networking

### Multi-Server Scaling

For horizontal scaling, consider:

1. **Redis Clustering** or **Redis Sentinel**
2. **Shared Redis for Rate Limiting**
3. **Load Balancer** (Nginx/HAProxy/Traefik)
4. **Container Orchestration** (Docker Swarm/Kubernetes)

**Example Kubernetes Deployment**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ciphershare
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ciphershare
  template:
    metadata:
      labels:
        app: ciphershare
    spec:
      containers:
        - name: app
          image: ciphershare:latest
          ports:
            - containerPort: 3001
          env:
            - name: REDIS_HOST
              value: redis-service
          resources:
            requests:
              memory: "256Mi"
              cpu: "500m"
            limits:
              memory: "512Mi"
              cpu: "1000m"
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# backup-ciphershare.sh

BACKUP_DIR="/backups/ciphershare"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup Redis data
docker run --rm \
  -v ciphershare_redis-data:/data \
  -v "$BACKUP_DIR:/backup" \
  alpine tar czf "/backup/redis-$DATE.tar.gz" -C /data .

# Backup environment config (without secrets)
docker exec ciphershare-app env | grep -v -E "KEY|PASSWORD|SECRET" > "$BACKUP_DIR/config-$DATE.txt"

# Keep last 7 days
find "$BACKUP_DIR" -name "redis-*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/redis-$DATE.tar.gz"
```

### Cron Schedule

```cron
# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup-ciphershare.sh >> /var/log/ciphershare-backup.log 2>&1
```

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Redis Docker Documentation](https://hub.docker.com/_/redis)
- [CipherShare Architecture](./ARCHITECTURE.md)
