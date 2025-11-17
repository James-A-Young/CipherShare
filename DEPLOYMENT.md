# 🚀 Deployment Checklist for CipherShare

Use this checklist when deploying CipherShare to production.

## Pre-Deployment

### Security Configuration

- [ ] **Generate New System Secret Key**

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

  Update `SYSTEM_SECRET_KEY` in production `.env`

- [ ] **Set Strong Redis Password**

  - Generate: `openssl rand -base64 32`
  - Update `REDIS_PASSWORD` in `.env`
  - Update docker-compose.prod.yml

- [ ] **Configure SendGrid**

  - [ ] Create SendGrid account
  - [ ] Verify sender email/domain
  - [ ] Generate API key with "Mail Send" permission
  - [ ] Update `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`

- [ ] **Update CLIENT_URL**
  - Set to your production domain (e.g., `https://ciphershare.yourdomain.com`)

### Environment Variables

Verify all required environment variables are set:

```bash
# Required for production
✓ NODE_ENV=production
✓ SYSTEM_SECRET_KEY=<64-char-hex>
✓ REDIS_HOST=<redis-host>
✓ REDIS_PORT=6379
✓ REDIS_PASSWORD=<strong-password>
✓ SENDGRID_API_KEY=<your-api-key>
✓ SENDGRID_FROM_EMAIL=<verified-email>
✓ PORT=3001
✓ CLIENT_URL=<your-production-url>
```

## Testing Before Deployment

### Local Testing

- [ ] **Run all tests**

  ```bash
  npm test
  ```

- [ ] **Build successfully**

  ```bash
  npm run build
  ```

- [ ] **Test all three workflows locally**

  - [ ] Request Generation
  - [ ] Secret Submission
  - [ ] Secret Retrieval

- [ ] **Test with production environment variables**
  ```bash
  NODE_ENV=production npm run dev
  ```

### Security Testing

- [ ] **Test encryption/decryption**

  - Create and retrieve a secret
  - Verify it requires correct password
  - Test wrong password rejection

- [ ] **Test expiration**

  - Create a secret with short TTL
  - Verify it expires correctly

- [ ] **Test view limits**
  - Create a secret with 1 view limit
  - Retrieve once
  - Verify second retrieval fails

## Deployment Steps

### Option 1: Docker Deployment

1. **Build Docker image**

   ```bash
   docker build -t ciphershare:latest .
   ```

2. **Start production stack**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Verify services are running**
   ```bash
   docker ps
   docker logs ciphershare-app
   docker logs ciphershare-redis-prod
   ```

### Option 2: Manual Deployment

1. **Install dependencies**

   ```bash
   npm install --production
   ```

2. **Build application**

   ```bash
   npm run build
   ```

3. **Start Redis**

   - Ensure Redis is running on specified host/port
   - Verify password authentication works

4. **Start application**
   ```bash
   npm run preview
   ```

### Reverse Proxy (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name ciphershare.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ciphershare.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /path/to/ciphershare/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

- [ ] Configure SSL/TLS certificates
- [ ] Set up HTTP to HTTPS redirect
- [ ] Configure proxy headers
- [ ] Enable gzip compression
- [ ] Set up rate limiting

## Post-Deployment

### Verification

- [ ] **Health check endpoint**

  ```bash
  curl https://ciphershare.yourdomain.com/api/health
  ```

- [ ] **Test complete workflow**

  1. Create a request
  2. Submit a secret
  3. Retrieve the secret
  4. Verify email notification

- [ ] **Test error scenarios**
  - Invalid request ID
  - Wrong password
  - Expired secret

### Monitoring

- [ ] **Set up monitoring**

  - Application logs
  - Redis metrics
  - Email delivery status
  - Error tracking (e.g., Sentry)

- [ ] **Configure alerts**
  - High error rate
  - Redis connection issues
  - Disk space warnings
  - Memory usage

### Backup

- [ ] **Configure Redis persistence**

  - Enable AOF (append-only file)
  - Set up regular backups
  - Test restore procedure

- [ ] **Backup environment variables**
  - Store securely (e.g., vault)
  - Document recovery process

## Security Hardening

### Network Security

- [ ] **Firewall rules**

  - Allow only necessary ports (80, 443, 22)
  - Restrict Redis access to localhost
  - Block direct Redis external access

- [ ] **CORS configuration**
  ```typescript
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
    })
  );
  ```

### Application Security

- [ ] **Rate limiting**

  ```typescript
  import rateLimit from "express-rate-limit";

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  });

  app.use("/api/", limiter);
  ```

- [ ] **Helmet.js for security headers**

  ```bash
  npm install helmet
  ```

- [ ] **Input validation**
  - Already implemented in API
  - Verify all edge cases tested

### Operational Security

- [ ] **Regular updates**

  - Set up dependabot
  - Regular npm audit
  - Update Docker images

- [ ] **Access control**
  - Limit server access
  - Use SSH keys only
  - Implement audit logging

## Maintenance

### Regular Tasks

- [ ] **Weekly**

  - Check logs for errors
  - Monitor Redis memory usage
  - Review email delivery rates

- [ ] **Monthly**

  - Update dependencies
  - Security audit
  - Performance review
  - Backup verification

- [ ] **Quarterly**
  - Rotate system keys (plan migration)
  - Review and update documentation
  - Load testing

## Rollback Plan

In case of issues:

1. **Keep previous version**

   ```bash
   docker tag ciphershare:latest ciphershare:backup
   ```

2. **Quick rollback**

   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Database backup**
   - Keep Redis dump.rdb
   - Document restore process

## Performance Optimization

- [ ] **Enable compression**

  - Gzip for API responses
  - Brotli for static assets

- [ ] **CDN for static assets**

  - Configure in production build
  - Update asset URLs

- [ ] **Redis optimization**
  - Set maxmemory policy
  - Enable memory optimization
  - Monitor key expiration

## Compliance

- [ ] **Privacy policy**

  - Document data handling
  - Retention policies
  - User rights

- [ ] **Terms of service**

  - Usage guidelines
  - Liability limitations

- [ ] **Security disclosure**
  - Responsible disclosure policy
  - Security contact email

## Final Checklist

Before going live:

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Backups automated
- [ ] SSL certificates valid
- [ ] DNS configured
- [ ] Email notifications working
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Logs being collected
- [ ] Rollback plan documented
- [ ] Team trained on operations

## Support Contact

- Emergency contact: [Your contact]
- On-call rotation: [Schedule]
- Escalation path: [Process]

---

**Last Updated**: [Date]
**Reviewed By**: [Team member]
**Next Review**: [Date]
