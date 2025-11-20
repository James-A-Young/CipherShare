# 📝 CipherShare - Developer Quick Reference

## 🚀 Quick Commands

```bash
# Setup
nvm use                       # Switch to Node 24 LTS (reads .nvmrc)
npm install                   # Install dependencies
docker-compose up -d          # Start Redis
npm run dev                   # Start dev servers
npm test                      # Run all tests (Vitest + Jest)

# Development
npm run dev:client            # Frontend only (Vite)
npm run dev:server            # Backend only (Express)
npm run test:frontend         # Frontend tests (Vitest)
npm run test:unit             # Backend tests (Jest)
npm run test:watch            # Frontend tests in watch mode

# Production
npm run build                 # Build for production
docker-compose -f docker-compose.prod.yml up -d  # Deploy

# Utilities
./scripts/setup.sh            # Complete dev setup
./scripts/generate-key.sh     # Generate secure key
```

## 🌐 Local URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Redis**: localhost:6379

## 📁 Key Files

### Frontend

- `src/App.tsx` - Main app with routing
- `src/components/RequestGeneration.tsx` - Create requests
- `src/components/SecretSubmission.tsx` - Submit secrets
- `src/components/SecretRetrieval.tsx` - Retrieve secrets
- `src/api.ts` - API client functions

### Backend

- `server/index.ts` - Express server & routes
- `server/crypto.service.ts` - Encryption logic
- `server/redis.service.ts` - Data persistence
- `server/email.service.ts` - SendGrid emails
- `server/types.ts` - TypeScript types

### Config

- `.env` - Environment variables
- `.nvmrc` - Node.js version (24 LTS)
- `vite.config.ts` - Vite configuration
- `vitest.config.js` - Vitest test config (frontend)
- `jest.config.js` - Jest test config (backend)
- `tsconfig.json` - TypeScript settings
- `tailwind.config.js` - Tailwind CSS v4 config
- `postcss.config.js` - PostCSS with @tailwindcss/postcss
- `docker-compose.yml` - Docker services

## 🔐 API Endpoints
### Rate Limits

All endpoints are rate-limited to prevent abuse:

| Endpoint        | Limit   | Window |
| --------------- | ------- | ------ |
| All `/api/*`    | 100 req | 15 min |
| Create Request  | 10 req  | 15 min |
| Submit Secret   | 5 req   | 15 min |
| Retrieve Secret | 10 req  | 15 min |

### Get Application Metadata

```bash
GET /api/config/metadata
# Returns configuration including CAPTCHA status
# Response: { "captchaEnabled": false, "turnstileSiteKey": "..." }
```


**Response Headers:**

- `RateLimit-Limit` - Max requests allowed
- `RateLimit-Remaining` - Requests remaining
- `RateLimit-Reset` - Reset timestamp

### Create Request

```bash
POST /api/requests
{
  "requestorEmail": "user@example.com",
  "description": "Secret description",
  "retentionType": "time",
  "retentionValue": 5
}
```

### Get Request

```bash
GET /api/requests/:requestId
```

### Submit Secret

```bash
POST /api/requests/:requestId/submit
{
  "submitterEmail": "submitter@example.com",
  "password": "StrongPass123!",
  "confirmPassword": "StrongPass123!",
  "secret": "The actual secret"
}
```

### Retrieve Secret

```bash
POST /api/secrets/:retrievalId
{
  "password": "StrongPass123!",
  "turnstileToken": "optional-if-captcha-enabled"
}
```

## 🔒 Environment Variables

```env
# Required
SYSTEM_SECRET_KEY=<64-char-hex>
REDIS_HOST=localhost
REDIS_PORT=6379

# Email Configuration
EMAIL_PROVIDER=sendgrid          # Options: "sendgrid" or "mailgun"
EMAIL_FROM=noreply@domain.com

# SendGrid (if EMAIL_PROVIDER=sendgrid)
SENDGRID_API_KEY=<your-key>

# Mailgun (if EMAIL_PROVIDER=mailgun)
MAILGUN_API_KEY=<your-key>
MAILGUN_DOMAIN=mg.yourdomain.com

# Server
PORT=3001
CLIENT_URL=http://localhost:5173

# CAPTCHA (Optional)
CAPTCHA_ENABLED=false  # true for production
CF_TURNSTILE_SITEKEY=  # Cloudflare Turnstile site key
CF_TURNSTILE_SECRET=   # Cloudflare Turnstile secret
CF_TURNSTILE_ALLOWED_HOSTNAMES=  # Optional hostname restrictions
```

### Email Provider Setup

**SendGrid:**

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@yourdomain.com
```

**Mailgun:**

```bash
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=xxxxx
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
```

**CAPTCHA (Production Recommended):**

```bash
CAPTCHA_ENABLED=true
CF_TURNSTILE_SITEKEY=1x00000000000000000000AA
CF_TURNSTILE_SECRET=1x0000000000000000000000000000000AA
CF_TURNSTILE_ALLOWED_HOSTNAMES=yourdomain.com
```

## 🧪 Testing

### Dual Testing Setup

This project uses **Vitest** for frontend and **Jest** for backend:

```bash
# Run all tests (both Vitest and Jest in parallel)
npm test

# Frontend tests only (Vitest)
npm run test:frontend

# Backend tests only (Jest)
npm run test:unit

# Watch mode (Vitest)
npm run test:watch

# Specific frontend test
npm run test:frontend -- RequestGeneration.test.tsx

# Specific backend test
npm run test:unit -- crypto.service.test.ts
```

### Why Dual Testing?

- **Vitest**: Optimized for Vite-based frontend code with HMR
- **Jest**: Battle-tested for Node.js backend with comprehensive tooling

## 🐳 Docker Commands

```bash
# Start Redis
docker-compose up -d

# Stop Redis
docker-compose down

# View logs
docker logs ciphershare-redis

# Restart Redis
docker-compose restart redis

# Clean up
docker-compose down -v
```

## 🔧 Common Tasks

### Generate New System Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Clear Redis Data

```bash
docker exec -it ciphershare-redis redis-cli FLUSHALL
```

### Check Redis Keys

```bash
docker exec -it ciphershare-redis redis-cli KEYS "*"
```

### View Specific Key

```bash
docker exec -it ciphershare-redis redis-cli GET "request:your-id"
```

### Check Redis Memory

```bash
docker exec -it ciphershare-redis redis-cli INFO memory
```

## 🎨 Frontend Development

### Component Structure

```tsx
import { useState } from "react";
import { api } from "../api";

export default function Component() {
  const [state, setState] = useState();

  const handleAction = async () => {
    try {
      const result = await api.method();
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return <div className="card">...</div>;
}
```

### Tailwind Classes

```css
.card              /* Gray card with border */

.btn-primary       /* Blue gradient button */
.btn-secondary     /* Gray button */
.input-field       /* Styled input/textarea */
.label; /* Form label */
```

## 🔐 Encryption Flow

### Encrypt (Server)

```typescript
// 1. User password → PBKDF2 → Key
const salt = crypto.randomBytes(32);
const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");

// 2. AES-256-GCM with user key
const userEncrypted = encrypt(secret, key);

// 3. AES-256-GCM with system key
const finalEncrypted = encrypt(userEncrypted, systemKey);

// 4. Store in Redis with TTL
await redis.set(id, finalEncrypted, "EX", ttl);
```

### Decrypt (Server)

```typescript
// 1. Get from Redis
const encrypted = await redis.get(id);

// 2. Decrypt with system key
const userEncrypted = decrypt(encrypted, systemKey);

// 3. Verify password
if (!verifyPassword(password, storedHash)) throw Error();

// 4. Decrypt with user password
const secret = decrypt(userEncrypted, derivedKey);
```

## 📊 Redis Data Structure

```
request:{uuid}
{
  requestId: string,
  requestorEmail: string,
  description: string,
  retentionType: 'view' | 'time',
  retentionValue: number,
  status: 'pending' | 'submitted',
  createdAt: number
}

secret:{uuid}
{
  retrievalId: string,
  requestId: string,
  encryptedSecret: string,
  passwordHash: string,
  viewsRemaining?: number,
  expiresAt: number
}
```

## 🐛 Debugging

### Check Backend Logs

```bash
# In dev mode, check terminal running npm run dev
# Look for server output (usually after [server] prefix)
```

### Check Frontend Logs

```bash
# Open browser DevTools (F12)
# Check Console tab for errors
# Check Network tab for API calls
```

### Test Encryption Locally

```typescript
import { CryptoService } from "./server/crypto.service";

const crypto = new CryptoService("your-64-char-key");
const { encrypted, passwordHash } = crypto.dualEncrypt("test", "password");
const decrypted = crypto.dualDecrypt(encrypted, "password");
console.log(decrypted === "test"); // Should be true
```

## 📚 Documentation Links

- [README.md](README.md) - Full documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick setup
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [CAPTCHA Configuration](docs/CAPTCHA_CONFIGURATION.md) - CAPTCHA setup
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribute

## 🆘 Troubleshooting

### Redis won't start

```bash
docker-compose down
docker system prune -f
docker-compose up -d
```

### Port in use

```bash
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
```

### Dependencies issue

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
# Check tsconfig.json
# Ensure @types packages installed
npm install --save-dev @types/node @types/react @types/react-dom
```

## 💡 Tips

1. **Use .env for local config** - Never commit secrets
2. **Use nvm for Node version** - Run `nvm use` to ensure Node 24 LTS
3. **Check logs first** - Most issues show in console
4. **Test incrementally** - Test each flow separately
5. **Clear Redis when testing** - Avoid stale data
6. **Use TypeScript strictly** - Catch errors early
7. **Run both test suites** - Vitest for frontend, Jest for backend
8. **Write tests** - For all new features
9. **Document changes** - Update relevant docs

## 📞 Need Help?

- Check error messages in console
- Search existing GitHub issues
- Read the documentation
- Create a new issue with details
