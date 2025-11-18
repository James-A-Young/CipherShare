# 🐳 Docker Production Deployment

## Multi-Platform Support

CipherShare Docker images are built for multiple architectures and work seamlessly on:
- **AMD64** (x86_64) - Traditional Intel/AMD processors
- **ARM64/v8** - ARM-based processors (Apple Silicon, AWS Graviton, Raspberry Pi 4+, etc.)

Docker automatically pulls the correct image for your platform. No special configuration needed!

## Quick Start

```bash
# 1. Configure environment
cp .env.prod.example .env.prod
nano .env.prod  # Edit with your values

# 2. Run deployment script
./docker-deploy.sh

# Or manually:
docker-compose -f docker-compose.prod.yml up -d
```

## What's Deployed

- **CipherShare App** (Node.js 24, Alpine Linux)
  - Express backend serving API
  - Pre-built React frontend
  - Port: 3001
- **Redis** (Redis 7, Alpine Linux)
  - Password-protected
  - Persistent storage
  - Port: 6379 (internal network)

## Container Features

✅ **Multi-stage build** - Optimized image size (~200MB)  
✅ **Multi-platform support** - Works on AMD64 and ARM64/v8 architectures  
✅ **Non-root user** - Enhanced security  
✅ **Health checks** - Automatic monitoring  
✅ **Log rotation** - Prevents disk overflow  
✅ **Auto-restart** - High availability  
✅ **Persistent volumes** - Data survives container restarts

## Management Commands

```bash
# View logs
npm run docker:logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop containers
npm run docker:stop
docker-compose -f docker-compose.prod.yml down

# Restart
docker-compose -f docker-compose.prod.yml restart

# Rebuild after code changes
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker ps
docker stats ciphershare-app-prod
```

## Environment Configuration

Required variables in `.env.prod`:

```env
# Redis
REDIS_PASSWORD=generate_with_openssl_rand_base64_32

# Encryption
SYSTEM_SECRET_KEY=generate_with_openssl_rand_hex_32

# Email
EMAIL_PROVIDER=sendgrid  # or mailgun
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=your_key

# App
CLIENT_URL=https://yourdomain.com
APP_PORT=3001
```

## Production Checklist

- [ ] Generate secure `REDIS_PASSWORD`
- [ ] Generate secure `SYSTEM_SECRET_KEY`
- [ ] Configure email provider (SendGrid or Mailgun)
- [ ] Set proper `CLIENT_URL`
- [ ] Configure reverse proxy (Nginx/Traefik)
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up backup cron job
- [ ] Configure log aggregation
- [ ] Set up monitoring/alerts

## Reverse Proxy

### Nginx Example

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Backup & Recovery

```bash
# Backup Redis data
docker run --rm \
  -v ciphershare_redis-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/redis-$(date +%Y%m%d).tar.gz -C /data .

# Restore Redis data
docker run --rm \
  -v ciphershare_redis-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/redis-YYYYMMDD.tar.gz -C /data
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs ciphershare-app-prod

# Verify environment
docker exec ciphershare-app-prod env | grep -E "REDIS|EMAIL|SYSTEM"
```

### Health check failing

```bash
# Test manually
curl http://localhost:3001/api/health

# Check from inside container
docker exec ciphershare-app-prod wget -qO- http://localhost:3001/api/health
```

### Redis connection failed

```bash
# Test connection
docker exec ciphershare-app-prod nc -zv redis 6379

# Check Redis logs
docker logs ciphershare-redis-prod
```

## Documentation

📚 **[Complete Docker Deployment Guide](docs/DOCKER_DEPLOYMENT.md)**

Includes:

- Architecture overview
- Multi-stage build explanation
- Security configurations
- Scaling considerations
- Monitoring setup
- Advanced troubleshooting

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [CipherShare Architecture](ARCHITECTURE.md)
- [API Reference](QUICK_REFERENCE.md)
- [Rate Limiting Guide](docs/RATE_LIMITING.md)
