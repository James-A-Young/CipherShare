# 🏗️ CipherShare Architecture

This document provides a comprehensive overview of CipherShare's architecture, design decisions, and technical implementation.

## System Overview

CipherShare is a full-stack web application designed for secure secret sharing with dual-layer encryption. The system follows a client-server architecture with the following components:

```
┌──────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
│  ┌────────────────────────────────────────────────────┐      │
│  │         React SPA (Vite + TypeScript)              │      │
│  │  - RequestGeneration Component                     │      │
│  │  - SecretSubmission Component                      │      │
│  │  - SecretRetrieval Component                       │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS/REST API
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   Express API Server                         │
│  ┌────────────────────────────────────────────────────┐      │
│  │  Middleware:                                       │      │
│  │  - Rate Limiting (100 req/15min general)          │      │
│  │  - CORS                                            │      │
│  │  - JSON Body Parser                               │      │
│  └────────────────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────────────────┐      │
│  │  Routes (with specific rate limits):               │      │
│  │  - POST /api/requests (10/15min)                  │      │
│  │  - GET  /api/requests/:id                         │      │
│  │  - POST /api/requests/:id/submit (5/15min)        │      │
│  │  - POST /api/secrets/:retrievalId (10/15min)      │      │
│  └────────────────────────────────────────────────────┘      │
│  ┌────────────────────────────────────────────────────┐      │
│  │  Services:                                         │      │
│  │  - CryptoService (AES-256-GCM)                    │      │
│  │  - RedisService (Data persistence)                │      │
│  │  - EmailService (SendGrid/Mailgun)               │      │
│  └────────────────────────────────────────────────────┘      │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│  Redis Database  │          │  SendGrid API    │
│  - Key-Value     │          │  - Email Delivery│
│  - Auto-Expiry   │          └──────────────────┘
│  - TTL Support   │
└──────────────────┘
```

## Core Components

### Frontend (React + TypeScript)

#### 1. RequestGeneration Component

**Purpose**: Allow requestors to create secure requests for sensitive information.

**Features**:

- Form validation for email and description
- Retention policy selection (view-based or time-based)
- URL generation and clipboard copy functionality
- Responsive dark-themed UI

**State Management**:

```typescript
- formData: CreateRequestPayload
- shareableUrl: string
- loading: boolean
- error: string
```

#### 2. SecretSubmission Component

**Purpose**: Enable submitters to fulfill requests with encrypted secrets.

**Features**:

- Request validation (pending/submitted status check)
- Password creation with confirmation
- Real-time form validation
- Email notification trigger

**Security Flow**:

1. Fetch request details
2. Validate request status
3. Encrypt secret with user password (client-side validation)
4. Send to server for dual encryption
5. Display success with retrieval URL

#### 3. SecretRetrieval Component

**Purpose**: Allow requestors to decrypt and view submitted secrets.

**Features**:

- Password-based decryption
- View count display
- Copy-to-clipboard functionality
- Auto-deletion notification

**Error Handling**:

- Invalid password
- Expired secrets
- View limit exceeded

### Backend (Express + TypeScript)

#### 1. CryptoService

**Purpose**: Handle all encryption/decryption operations.

**Algorithms**:

- **AES-256-GCM**: Authenticated encryption with associated data
- **PBKDF2**: Password-based key derivation (100,000 iterations)
- **SHA-256**: Hash function for password verification

**Methods**:

```typescript
// System-level encryption
encryptWithSystemKey(data: string): string
decryptWithSystemKey(encrypted: string): string

// Password-based encryption
encryptWithPassword(data: string, password: string): { encrypted: string, passwordHash: string }
decryptWithPassword(encrypted: string, password: string): string

// Dual encryption (combines both layers)
dualEncrypt(data: string, password: string): { encrypted: string, passwordHash: string }
dualDecrypt(encrypted: string, password: string): string

// Password management
hashPassword(password: string): string
verifyPassword(password: string, hash: string): boolean
```

**Encryption Format**:

```
[IV:16 bytes]:[Auth Tag:16 bytes]:[Encrypted Data]
(All encoded in hex)
```

#### 2. RedisService

**Purpose**: Manage data persistence with automatic expiration.

**Data Structures**:

```typescript
// Secret Request
request:{requestId} → {
  requestId: string,
  requestorEmail: string,
  description: string,
  retentionType: 'view' | 'time',
  retentionValue: number,
  status: 'pending' | 'submitted',
  createdAt: number,
  submittedAt?: number
}

// Submitted Secret
secret:{retrievalId} → {
  retrievalId: string,
  requestId: string,
  encryptedSecret: string,
  passwordHash: string,
  viewsRemaining?: number,
  expiresAt: number,
  createdAt: number
}
```

**TTL Strategy**:

- View-based: Max 10 days, manual deletion on view limit
- Time-based: 3, 5, or 10 days
- Absolute maximum: 10 days regardless of policy

#### 3. EmailService

**Purpose**: Send notification emails via SendGrid or Mailgun.

#### 4. Utility Functions (utils.ts)

**Purpose**: Provide common utility functions for the server.

**Functions**:

```typescript
// CAPTCHA verification with Cloudflare Turnstile
verifyTurnstile(token: string, secret: string, remoteIp?: string, allowedHostnames?: string[]): Promise<boolean>

// Parse boolean environment variables
isFeatureEnabled(value: string): boolean
```

**Email Types**:

1. **Retrieval Link Email**: Sent when secret is submitted
   - Contains retrieval URL
   - Instructions for password
   - Security reminders

#### 5. Rate Limiters

**Purpose**: Protect API endpoints from abuse and attacks.

**Module**: `server/rate-limiters.ts`

**Exported Limiters**:

- `generalLimiter` - 100 req/15min for all API routes
- `requestCreationLimiter` - 10 req/15min for creating requests
- `secretSubmissionLimiter` - 5 req/15min for submitting secrets
- `secretRetrievalLimiter` - 10 req/15min for retrieving secrets

**Configuration**: Each limiter uses `express-rate-limit` with:

- `windowMs`: 15-minute sliding window
- `max`: Request limit per IP
- `standardHeaders`: true (RFC draft headers)
- `legacyHeaders`: false

**Template Features**:

- HTML formatted
- Dark-themed design
- Responsive layout
- Security warnings

## Security Architecture

### Rate Limiting

CipherShare implements multi-tier rate limiting to protect against various attack vectors:

#### General API Protection

- **Limit**: 100 requests per 15 minutes per IP
- **Applies to**: All `/api/*` endpoints
- **Purpose**: Prevent general API abuse and resource exhaustion

#### Request Creation Limiter

- **Limit**: 10 requests per 15 minutes per IP
- **Applies to**: `POST /api/requests`
- **Purpose**: Prevent spam request creation

#### Secret Submission Limiter

- **Limit**: 5 submissions per 15 minutes per IP
- **Applies to**: `POST /api/requests/:id/submit`
- **Purpose**: Prevent secret spam and abuse

#### Secret Retrieval Limiter

- **Limit**: 10 attempts per 15 minutes per IP
- **Applies to**: `POST /api/secrets/:retrievalId`
- **Purpose**: Prevent password brute-force attacks

#### Implementation Details

Rate limiters are defined in `server/rate-limiters.ts` and imported into the main application:

```typescript
// server/rate-limiters.ts
import rateLimit from "express-rate-limit";

export const secretRetrievalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many retrieval attempts, please try again later.",
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
});

// server/index.ts
import { secretRetrievalLimiter } from "./rate-limiters";

app.post("/api/secrets/:id", secretRetrievalLimiter, handler);
```

#### Response Headers

When rate limiting is active, the following headers are included:

- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Unix timestamp when the limit resets

#### Error Response

When limit is exceeded:

```json
{
  "error": "Too many requests, please try again later."
}
```

Status code: `429 Too Many Requests`

**📚 For comprehensive rate limiting documentation**, including client handling, production considerations, and testing strategies, see [docs/RATE_LIMITING.md](docs/RATE_LIMITING.md)

### CAPTCHA Protection (Optional)

CipherShare includes optional Cloudflare Turnstile CAPTCHA integration to prevent automated abuse:

**Feature Toggle**:
- Environment variable: `CAPTCHA_ENABLED` (default: `true`)
- Can be enabled/disabled without code changes

**Protected Endpoints**:
- `POST /api/requests` - Prevents automated request creation
- `POST /api/secrets/:retrievalId` - Prevents automated password guessing

**Implementation Details**:

```typescript
// Server validates token if CAPTCHA is enabled
if (CAPTCHA_ENABLED) {
  const { turnstileToken } = req.body;
  if (!turnstileToken) {
    return res.status(400).json({ error: 'CAPTCHA token is required' });
  }
  
  const captchaValid = await verifyTurnstile(
    turnstileToken,
    CF_TURNSTILE_SECRET,
    req.ip,
    allowedHostnames
  );
  
  if (!captchaValid) {
    return res.status(401).json({ error: 'CAPTCHA validation failed' });
  }
}
// Continue with request processing...
```

**Client Integration**:
- Frontend fetches metadata from `/api/config/metadata`
- Turnstile widget loads only if `captchaEnabled: true`
- Token automatically included in protected API calls

**Configuration**:
```env
CAPTCHA_ENABLED=true
CF_TURNSTILE_SITEKEY=1x00000000000000000000AA
CF_TURNSTILE_SECRET=1x0000000000000000000000000000000AA
CF_TURNSTILE_ALLOWED_HOSTNAMES=example.com,app.example.com
```

**📚 For complete CAPTCHA configuration**, see [docs/CAPTCHA_CONFIGURATION.md](docs/CAPTCHA_CONFIGURATION.md)

### Encryption Layers

#### Layer 1: System Key Encryption

**Purpose**: Protect data at rest in the database.

```
Plain Text → AES-256-GCM(System Key) → Encrypted Blob
```

- Key stored as environment variable
- 256-bit key (32 bytes)
- Never transmitted to client
- Same key for all records

#### Layer 2: Password-Based Encryption

**Purpose**: Ensure only password holder can decrypt.

```
Plain Text → PBKDF2(Password, Salt) → Derived Key → AES-256-GCM → Encrypted Blob
```

- Unique salt per encryption
- 100,000 iterations (PBKDF2)
- Password never stored
- Only hash stored for verification

### Combined Flow

```
┌──────────────┐
│ Secret Text  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ User Password Key    │  ← Layer 2
│ (PBKDF2 + AES-256)   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ System Key           │  ← Layer 1
│ (AES-256-GCM)        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Redis Storage        │
└──────────────────────┘
```

### Security Features

1. **No Password Storage**: Only PBKDF2 hashes stored
2. **Unique IVs**: Every encryption uses a new random IV
3. **Authentication Tags**: GCM mode provides integrity verification
4. **Timing-Safe Comparison**: Prevents timing attacks on password verification
5. **Automatic Expiration**: Reduces attack window
6. **View Limits**: Prevents unlimited decryption attempts

## Data Flow

### 1. Request Creation Flow

```
User → Frontend
  ↓
  Form Submission
  ↓
POST /api/requests
  ↓
Express Server
  ↓
Generate UUID
  ↓
Encrypt with System Key
  ↓
Store in Redis with TTL
  ↓
Return Shareable URL
  ↓
Display to User
```

### 2. Secret Submission Flow

```
Submitter → Request URL
  ↓
GET /api/requests/:id
  ↓
Display Form
  ↓
Enter Secret + Password
  ↓
POST /api/requests/:id/submit
  ↓
Server: Dual Encrypt
  ↓
Store in Redis
  ↓
Send Email (SendGrid)
  ↓
Display Success
```

### 3. Secret Retrieval Flow

```
Requestor → Retrieval URL
  ↓
Display Password Form
  ↓
Enter Password
  ↓
POST /api/secrets/:retrievalId
  ↓
Fetch from Redis
  ↓
Verify Password Hash
  ↓
Decrypt (System Key)
  ↓
Decrypt (User Password)
  ↓
Update View Count
  ↓
Delete if Limit Reached
  ↓
Return Secret
  ↓
Display to User
```

## Database Schema (Redis)

### Key Patterns

```
request:{uuid}  → Encrypted request data
secret:{uuid}   → Encrypted secret data
```

### TTL Management

```typescript
// Calculate TTL
function calculateTTL(retentionType: string, retentionValue: number): number {
  if (retentionType === "time") {
    return Math.min(retentionValue, 10) * 86400; // Days to seconds
  }
  return 10 * 86400; // Max 10 days for view-based
}

// Set with expiration
await redis.set(key, value, "EX", ttl);
```

## API Design

### RESTful Endpoints

| Method | Endpoint                 | Purpose                | Auth       | CAPTCHA  |
| ------ | ------------------------ | ---------------------- | ---------- | -------- |
| GET    | /api/health              | Health check           | No         | No       |
| GET    | /api/config/metadata     | Get app configuration  | No         | No       |
| POST   | /api/requests            | Create request         | No         | Optional |
| GET    | /api/requests/:id        | Get request            | No         | No       |
| POST   | /api/requests/:id/submit | Submit secret          | No         | No       |
| POST   | /api/secrets/:id         | Retrieve secret        | Password   | Optional |

### Error Handling

Standard HTTP status codes:

- 200: Success
- 400: Bad request (validation)
- 401: Unauthorized (invalid password)
- 404: Not found
- 410: Gone (expired)
- 500: Server error

### Response Format

```typescript
// Success
{
  "data": { ... },
  "message": "Success"
}

// Error
{
  "error": "Error message"
}
```

## Performance Considerations

### Frontend

- Code splitting with React Router
- Lazy loading components
- Memoization for expensive computations
- Debounced form validation

### Backend

- Connection pooling for Redis
- Async/await for non-blocking I/O
- Error boundaries and proper error handling
- Request timeout configuration

### Database

- Redis in-memory storage (sub-millisecond latency)
- Automatic key expiration (no cleanup needed)
- Persistence with AOF (append-only file)

## Deployment Architecture

### Production Considerations

1. **Environment Variables**

   - Strong system key (generate new)
   - Redis password enabled
   - HTTPS only
   - CORS configured

2. **Scaling**

   - Stateless API (horizontal scaling)
   - Redis cluster for HA
   - Load balancer (nginx/HAProxy)
   - CDN for frontend assets

3. **Monitoring**
   - Application logs
   - Redis metrics
   - Email delivery status
   - Error tracking (Sentry)

## Future Enhancements

1. **Technical**

   - WebSocket for real-time notifications
   - Progressive Web App (PWA)
   - Service worker for offline support
   - GraphQL API option

2. **Security**

   - Rate limiting per IP
   - CAPTCHA for bot prevention
   - Audit logging

3. **Features**
   - File attachments
   - Multiple secrets per request
   - Secret sharing groups
   - Custom expiration times
   - Multi-language CAPTCHA support

### Testing Architecture

This project uses a **dual testing setup** optimized for different environments:

#### Frontend Tests (Vitest)

- **Framework**: Vitest 4.0 with jsdom environment
- **Location**: `src/__tests__/**/*.test.{ts,tsx}`
- **Purpose**: React component testing, UI logic, and client-side behavior
- **Features**: Fast HMR, native ESM, Vite-powered builds
- **Command**: `npm run test:frontend`

#### Backend Tests (Jest)

- **Framework**: Jest 29.7 with ts-jest
- **Location**: `server/**/*.test.{ts,tsx}`
- **Purpose**: Server logic, API endpoints, encryption services
- **Features**: Mature ecosystem, extensive mocking capabilities
- **Command**: `npm run test:unit`

#### Why Dual Testing?

- **Vitest**: Optimized for Vite-based frontend code, shares config with dev/build
- **Jest**: Battle-tested for Node.js backend code with comprehensive tooling
- **Parallel Execution**: Both suites run simultaneously via `npm test`

### CSS Architecture (Tailwind v4)

Tailwind CSS v4 introduces a **CSS-first configuration approach**:

```css
/* Old v3 syntax */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* New v4 syntax */
@import "tailwindcss";
```

**Key Changes**:

- PostCSS plugin: `@tailwindcss/postcss` instead of `tailwindcss`
- Configuration via CSS custom properties instead of `tailwind.config.js`
- Improved performance with native CSS cascade layers
- Better tree-shaking and smaller bundle sizes

---

**Last Updated**: November 20, 2025 (Version 1.1.0 - Added CAPTCHA support)
