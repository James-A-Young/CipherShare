# 🚀 Environment Configuration Guide

## Overview

CipherShare uses environment variables for configuration. Different files are provided for different deployment scenarios.

## Configuration Files

| File | Purpose | Usage |
|------|---------|-------|
| `.env.example` | Development template | Copy to `.env` for local development |
| `.env.production.example` | Production template | Copy to `.env` for production deployment |
| `docker-compose.yml` | Development setup | Local development with Redis |
| `docker-compose.prod.yml` | Production setup | Production deployment with all services |

## Quick Start

### Development Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Generate a system key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Update `.env` with your values:**
   ```env
   SYSTEM_SECRET_KEY=<generated-key-from-step-2>
   EMAIL_FROM=your-email@example.com
   SENDGRID_API_KEY=your-api-key
   ```

4. **Start Redis:**
   ```bash
   docker-compose up -d
   ```

5. **Start the application:**
   ```bash
   npm run dev
   ```

### Production Deployment

1. **Copy the production template:**
   ```bash
   cp .env.production.example .env
   ```

2. **Fill in all REQUIRED fields:**
   - `SYSTEM_SECRET_KEY` - Generate unique 64-char hex key
   - `EMAIL_FROM` - Your verified sender email
   - `SENDGRID_API_KEY` or `MAILGUN_API_KEY` + `MAILGUN_DOMAIN`
   - `CLIENT_URL` - Your production domain
   - `ALLOWED_ORIGINS` - Comma-separated allowed domains
   - `REDIS_PASSWORD` - Strong password for Redis

3. **Configure security settings:**
   - Set `PROXY_LAYERS` based on your infrastructure
   - Enable CAPTCHA with Turnstile keys
   - Review all security settings

4. **Deploy with Docker Compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Environment Variables Reference

### Required Variables

These variables MUST be set or the application will not start:

| Variable | Description | Example |
|----------|-------------|---------|
| `SYSTEM_SECRET_KEY` | 64-char hex encryption key | `0123...cdef` (64 chars) |
| `EMAIL_FROM` | Verified sender email | `noreply@yourdomain.com` |

### Email Configuration (Choose One)

**Option 1: SendGrid**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
```

**Option 2: Mailgun**
```env
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
```

### Security Variables (Recommended)

| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_ORIGINS` | `CLIENT_URL` | Comma-separated CORS origins |
| `PROXY_LAYERS` | `1` | Number of reverse proxies |
| `CAPTCHA_ENABLED` | `true` | Enable/disable CAPTCHA |

### CAPTCHA Configuration (Optional)

Get keys at: https://dash.cloudflare.com/?to=/:account/turnstile

```env
CAPTCHA_ENABLED=true
CF_TURNSTILE_SITEKEY=1x00000000000000000000AA
CF_TURNSTILE_SECRET=1x0000000000000000000000000000000AA
CF_TURNSTILE_ALLOWED_HOSTNAMES=yourdomain.com,app.yourdomain.com
```

### Infrastructure Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3001` | Application port |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL |
| `REDIS_HOST` | `localhost` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | (empty) | Redis password |

## Common Configurations

### Local Development
```env
NODE_ENV=development
SYSTEM_SECRET_KEY=<generated-key>
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=dev@example.com
SENDGRID_API_KEY=<your-key>
CLIENT_URL=http://localhost:5173
CAPTCHA_ENABLED=false  # Disable for easier testing
```

### Staging Environment
```env
NODE_ENV=production
SYSTEM_SECRET_KEY=<unique-staging-key>
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=staging@yourdomain.com
SENDGRID_API_KEY=<staging-key>
CLIENT_URL=https://staging.yourdomain.com
ALLOWED_ORIGINS=https://staging.yourdomain.com
PROXY_LAYERS=1
CAPTCHA_ENABLED=true
CF_TURNSTILE_SITEKEY=<staging-sitekey>
CF_TURNSTILE_SECRET=<staging-secret>
REDIS_PASSWORD=<strong-password>
```

### Production Environment
```env
NODE_ENV=production
SYSTEM_SECRET_KEY=<unique-production-key>
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=<production-key>
CLIENT_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
PROXY_LAYERS=2  # If behind CloudFlare + nginx
CAPTCHA_ENABLED=true
CF_TURNSTILE_SITEKEY=<production-sitekey>
CF_TURNSTILE_SECRET=<production-secret>
CF_TURNSTILE_ALLOWED_HOSTNAMES=yourdomain.com,app.yourdomain.com
REDIS_PASSWORD=<very-strong-password>
```

## Proxy Layers Configuration

Set `PROXY_LAYERS` based on your infrastructure:

| Setup | PROXY_LAYERS | Example |
|-------|--------------|---------|
| Direct to internet | `0` | Bare metal server |
| Behind one proxy | `1` | Docker → nginx |
| Behind two proxies | `2` | Docker → nginx → CloudFlare |
| Behind three proxies | `3` | Docker → nginx → ALB → CloudFlare |

**Why this matters:** 
- Ensures correct client IP detection
- Critical for rate limiting
- Prevents IP spoofing attacks

## Security Best Practices

### ✅ DO:
- Generate unique `SYSTEM_SECRET_KEY` for each environment
- Use strong `REDIS_PASSWORD` (20+ random characters)
- Keep `.env` file out of version control (in `.gitignore`)
- Backup `SYSTEM_SECRET_KEY` in secure location
- Use separate keys for staging and production
- Enable CAPTCHA in production
- Set specific `ALLOWED_ORIGINS` in production
- Verify email sender address with your provider

### ❌ DON'T:
- Use the example key from `.env.example`
- Commit `.env` to Git
- Share encryption keys via insecure channels
- Use same keys across environments
- Leave `REDIS_PASSWORD` empty in production
- Set `ALLOWED_ORIGINS=*` in production
- Disable CAPTCHA in production without good reason

## Validation

The application validates required variables on startup:

```bash
# If missing required variables:
❌ CRITICAL: Missing required environment variables: SYSTEM_SECRET_KEY, EMAIL_FROM
# Application exits

# If invalid SYSTEM_SECRET_KEY:
❌ CRITICAL: SYSTEM_SECRET_KEY must be exactly 64 hex characters (32 bytes)
Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Application exits
```

## Troubleshooting

### Application won't start
**Error:** "Missing required environment variables"
- **Solution:** Ensure `SYSTEM_SECRET_KEY` and `EMAIL_FROM` are set

**Error:** "SYSTEM_SECRET_KEY must be 64 hex characters"
- **Solution:** Generate new key with provided command, must be exactly 64 characters

### CORS errors in browser
**Error:** "Not allowed by CORS"
- **Solution:** Add your domain to `ALLOWED_ORIGINS` or ensure it matches `CLIENT_URL`

### Rate limiting not working
**Issue:** Limits reset on server restart
- **Solution:** Ensure Redis is running and accessible

### Wrong IP addresses in logs
**Issue:** Seeing proxy IP instead of client IP
- **Solution:** Set `PROXY_LAYERS` to match your infrastructure

## Docker Compose Variables

### Production docker-compose.prod.yml

All environment variables are read from your `.env` file:

```yaml
environment:
  - SYSTEM_SECRET_KEY=${SYSTEM_SECRET_KEY}
  - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
  # ... etc
```

**Optional overrides:**
```env
# Docker-specific variables
APP_PORT=3001              # External port mapping
REDIS_EXTERNAL_PORT=6379   # External Redis port (if needed)
```

## Getting Help

- See `SECURITY_FIXES.md` for security configuration details
- See `DEPLOYMENT.md` for deployment instructions
- See `README.md` for general documentation
- Open an issue on GitHub for problems

---

**Last Updated:** November 20, 2025  
**Version:** 1.1.1 (Security Hardening)
