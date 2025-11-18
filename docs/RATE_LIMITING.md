# Rate Limiting Documentation

## Overview

CipherShare implements comprehensive rate limiting using `express-rate-limit` to protect against various types of abuse and attacks. The application uses a multi-tier rate limiting strategy with different limits for different endpoints based on their sensitivity and potential for abuse.

## Rate Limiting Strategy

### Multi-Tier Approach

CipherShare uses four levels of rate limiting:

1. **General API Protection** - Applies to all API routes
2. **Request Creation Protection** - Specifically for creating new secret requests
3. **Secret Submission Protection** - For submitting secrets to requests
4. **Secret Retrieval Protection** - For retrieving secrets (most strict to prevent brute force)

### Rate Limit Tiers

| Tier         | Endpoint                        | Limit        | Window | Purpose                     |
| ------------ | ------------------------------- | ------------ | ------ | --------------------------- |
| **General**  | `GET /api/*`                    | 100 requests | 15 min | Prevent general API abuse   |
| **Create**   | `POST /api/requests`            | 10 requests  | 15 min | Prevent request spam        |
| **Submit**   | `POST /api/requests/:id/submit` | 5 requests   | 15 min | Prevent secret spam         |
| **Retrieve** | `POST /api/secrets/:id`         | 10 requests  | 15 min | Prevent brute force attacks |

## Implementation Details

### Technology

- **Package**: `express-rate-limit` v7.x
- **Storage**: In-memory (suitable for single-server deployments)
- **Headers**: Standard `RateLimit-*` headers (RFC draft)

### Configuration

Rate limiters are defined in a dedicated module (`server/rate-limiters.ts`) for better organization and reusability:

```typescript
// server/rate-limiters.ts
import rateLimit from "express-rate-limit";

/**
 * General API rate limiter - 100 requests per 15 minutes
 * Applied to all /api/* routes to prevent general abuse
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const requestCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests created, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ... other limiters
```

```typescript
// server/index.ts - Import and apply limiters
import {
  generalLimiter,
  requestCreationLimiter,
  secretSubmissionLimiter,
  secretRetrievalLimiter,
} from "./rate-limiters";

// Apply to all API routes
app.use("/api", generalLimiter);

// Apply specific limiters to individual routes
app.post("/api/requests", requestCreationLimiter, handler);
app.post("/api/requests/:id/submit", secretSubmissionLimiter, handler);
app.post("/api/secrets/:id", secretRetrievalLimiter, handler);
```

## Response Format

### Within Limits

When a request is within the rate limit, standard response headers are included:

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 85
RateLimit-Reset: 1700000000
Content-Type: application/json
```

### Limit Exceeded

When the rate limit is exceeded, a `429 Too Many Requests` response is returned:

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 10
RateLimit-Remaining: 0
RateLimit-Reset: 1700000900
Content-Type: application/json

{
  "error": "Too many requests, please try again later."
}
```

## Response Headers

### Standard Headers (RFC Draft)

- **`RateLimit-Limit`**: Maximum number of requests allowed in the current window
- **`RateLimit-Remaining`**: Number of requests remaining in the current window
- **`RateLimit-Reset`**: Unix timestamp (seconds) when the rate limit window resets

### Example

```http
RateLimit-Limit: 100
RateLimit-Remaining: 85
RateLimit-Reset: 1700000000
```

The client can calculate time until reset:

```javascript
const resetTime = parseInt(headers["ratelimit-reset"]);
const now = Math.floor(Date.now() / 1000);
const secondsUntilReset = resetTime - now;
```

## Use Cases & Protection

### 1. Request Creation (10 req/15min)

**Threat**: Spam request generation flooding the system

**Protection**:

- Prevents attackers from creating thousands of fake requests
- Limits legitimate users to reasonable request creation rate
- Protects Redis storage from overflow

**User Impact**:

- Low - typical users create 1-2 requests per session
- 10 requests per 15 minutes is generous for normal usage

### 2. Secret Submission (5 req/15min)

**Threat**: Secret spam attacks

**Protection**:

- Prevents malicious actors from submitting spam secrets
- Reduces email notification abuse
- Protects storage resources

**User Impact**:

- Very low - users typically submit 1 secret per request
- 5 submissions per 15 minutes allows for retries

### 3. Secret Retrieval (10 req/15min)

**Threat**: Password brute force attacks

**Protection**:

- Most critical protection layer
- Prevents attackers from trying many passwords
- 10 attempts per 15 minutes makes brute force impractical

**User Impact**:

- Minimal - users typically retrieve once
- 10 attempts allows for password typos

### 4. General API (100 req/15min)

**Threat**: General API abuse and DDoS

**Protection**:

- Catches any endpoints not covered by specific limiters
- Prevents resource exhaustion
- Baseline protection layer

**User Impact**:

- Very low - typical user sessions use 5-20 requests
- 100 requests per 15 minutes is generous

## Client Handling

### Detecting Rate Limits

Clients should monitor the response headers to detect approaching limits:

```typescript
const checkRateLimit = (response: Response) => {
  const limit = parseInt(response.headers.get("RateLimit-Limit") || "0");
  const remaining = parseInt(
    response.headers.get("RateLimit-Remaining") || "0"
  );
  const reset = parseInt(response.headers.get("RateLimit-Reset") || "0");

  if (remaining < 5) {
    console.warn(`Rate limit warning: ${remaining} requests remaining`);
  }

  return { limit, remaining, reset };
};
```

### Handling 429 Responses

```typescript
const makeRequest = async (url: string, options: RequestInit) => {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const resetTime = parseInt(response.headers.get("RateLimit-Reset") || "0");
    const waitSeconds = resetTime - Math.floor(Date.now() / 1000);

    throw new Error(
      `Rate limit exceeded. Please wait ${waitSeconds} seconds before retrying.`
    );
  }

  return response;
};
```

### Implementing Retry Logic

```typescript
const fetchWithRetry = async (url: string, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        const reset = parseInt(response.headers.get("RateLimit-Reset") || "0");
        const waitMs = (reset - Math.floor(Date.now() / 1000)) * 1000;

        if (attempt < maxRetries - 1) {
          console.log(`Rate limited. Waiting ${waitMs}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
};
```

## Configuration Options

### Adjusting Limits

To adjust rate limits, modify the configuration in `server/index.ts`:

```typescript
// More strict (production with high traffic)
const requestCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Reduced from 10
  message: "Too many requests created",
});

// More lenient (development/testing)
const requestCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased from 10
  message: "Too many requests created",
});
```

### Per-User Limits

For more advanced scenarios, you can implement per-user limits instead of per-IP:

```typescript
const userBasedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => {
    // Use user ID from authentication
    return req.user?.id || req.ip;
  },
});
```

### Skip Conditions

You can skip rate limiting for certain conditions:

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/api/health";
  },
});
```

## Production Considerations

### 1. Distributed Systems

**Current Implementation**: In-memory storage (suitable for single server)

**For Multiple Servers**: Use Redis as shared storage:

```typescript
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";

const client = createClient({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

const limiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: "rl:",
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

### 2. Behind a Proxy/Load Balancer

If behind a proxy, enable trust proxy in Express:

```typescript
app.set("trust proxy", 1); // Trust first proxy
```

This ensures rate limiting uses the real client IP, not the proxy's IP.

### 3. Monitoring

Monitor rate limit hits in production:

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    // Send to monitoring service (e.g., Sentry, DataDog)
    res.status(429).json({
      error: "Too many requests, please try again later.",
    });
  },
});
```

### 4. Custom Messages

Provide more helpful messages per endpoint:

```typescript
const retrievalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error:
      "Too many password attempts. Please wait 15 minutes before trying again.",
    retryAfter: "15 minutes",
  },
});
```

## Testing Rate Limits

### Manual Testing

```bash
# Test request creation limit (10 per 15 min)
for i in {1..12}; do
  curl -X POST http://localhost:3001/api/requests \
    -H "Content-Type: application/json" \
    -d '{
      "requestorEmail": "test@example.com",
      "description": "Test request '$i'",
      "retentionType": "time",
      "retentionValue": 3
    }'
  echo "\nRequest $i completed"
done
```

Expected: First 10 succeed, 11th and 12th return 429.

### Automated Testing

```typescript
describe("Rate Limiting", () => {
  it("should limit request creation to 10 per 15 minutes", async () => {
    const requests = [];

    // Make 11 requests
    for (let i = 0; i < 11; i++) {
      requests.push(
        fetch("http://localhost:3001/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestorEmail: "test@example.com",
            description: "Test",
            retentionType: "time",
            retentionValue: 3,
          }),
        })
      );
    }

    const responses = await Promise.all(requests);
    const statuses = responses.map((r) => r.status);

    // First 10 should succeed
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    // 11th should be rate limited
    expect(statuses[10]).toBe(429);
  });
});
```

## Security Benefits

### 1. Brute Force Protection

- **10 password attempts per 15 minutes** makes brute forcing impractical
- Even with common passwords, attackers can't iterate quickly

### 2. DDoS Mitigation

- **100 requests per 15 minutes per IP** limits damage from distributed attacks
- Prevents single IP from overwhelming the server

### 3. Resource Protection

- Protects Redis from storage overflow
- Prevents email service abuse
- Limits server CPU/memory usage

### 4. Spam Prevention

- **5 secret submissions per 15 minutes** prevents spam attacks
- **10 request creations per 15 minutes** limits fake request generation

## Limitations

### 1. IP-Based Tracking

- Users behind same NAT/proxy share limits
- VPN users can bypass by switching IPs
- Consider implementing user-based limits with authentication

### 2. In-Memory Storage

- Limits reset if server restarts
- Not suitable for multi-server deployments
- Use Redis store for production clustering

### 3. Header Reliability

- Clients can ignore rate limit headers
- Some proxies may strip headers
- Server-side enforcement is primary protection

## Future Enhancements

### 1. User Authentication

```typescript
// Per-user limits instead of per-IP
keyGenerator: (req) => req.user?.id || req.ip;
```

### 2. Dynamic Limits

```typescript
// Adjust limits based on server load
max: async (req) => {
  const serverLoad = await getServerLoad();
  return serverLoad > 80 ? 50 : 100;
};
```

### 3. Whitelist/Blacklist

```typescript
// Skip rate limiting for trusted IPs
skip: (req) => TRUSTED_IPS.includes(req.ip);
```

### 4. Cost-Based Limits

```typescript
// Different costs for different operations
cost: (req) => {
  if (req.path.includes("/submit")) return 2;
  if (req.path.includes("/retrieve")) return 3;
  return 1;
};
```

## References

- [express-rate-limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
- [RFC 6585 - Additional HTTP Status Codes](https://tools.ietf.org/html/rfc6585)
- [IETF Draft - RateLimit Headers](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers)
- [OWASP - Denial of Service](https://owasp.org/www-community/attacks/Denial_of_Service)
