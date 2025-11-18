---
applyTo: "server/**/*.ts"
excludeAgent: "code-review"
---

# Backend Development Instructions

## Express Server Setup

### Middleware Configuration

- Apply CORS middleware with appropriate origin configuration
- Implement rate limiting on all endpoints (especially sensitive ones)
- Use express.json() for request body parsing
- Add error handling middleware

### API Endpoints

- Follow RESTful conventions
- Use proper HTTP status codes
- Implement input validation for all endpoints
- Return consistent JSON response formats

### Rate Limiting Strategy

```typescript
// General rate limit: 100 requests per 15 minutes
// Sensitive endpoints:
// - POST /api/requests: 10/15min
// - POST /api/requests/:id/submit: 5/15min
// - POST /api/secrets/:retrievalId: 10/15min
```

## Service Layer Architecture

### CryptoService

**Purpose**: Handle all encryption, decryption, and password hashing operations

**Key Methods**:
- `encryptWithSystemKey()`: System-level AES-256-GCM encryption
- `decryptWithSystemKey()`: System-level decryption
- `encryptWithPassword()`: User password-based encryption
- `decryptWithPassword()`: User password-based decryption
- `hashPassword()`: PBKDF2 password hashing
- `verifyPassword()`: Timing-safe password verification

**Security Requirements**:
- Always generate new IVs for each encryption
- Use 32-byte keys for AES-256-GCM
- Use 100,000 iterations for PBKDF2
- Implement timing-safe comparisons for password verification
- Never log encryption keys or decrypted data

### RedisService

**Purpose**: Manage data persistence with automatic expiration

**Key Methods**:
- `saveRequest()`: Store request metadata with TTL
- `getRequest()`: Retrieve request by ID
- `saveSecret()`: Store encrypted secrets with TTL
- `getSecret()`: Retrieve secret with view tracking
- `deleteSecret()`: Manual secret deletion

**Data Management**:
- Use appropriate TTL values (max 10 days)
- Implement view count tracking
- Handle connection errors gracefully
- Clean up expired data automatically

### EmailService

**Purpose**: Send notifications to requestors

**Supported Providers**:
- SendGrid (preferred)
- Mailgun (alternative)

**Requirements**:
- Use HTML email templates
- Include reference field in notifications
- Handle email delivery failures gracefully
- Never include secrets or passwords in emails
- Log delivery status for debugging

## Data Types and Interfaces

### Type Definitions

```typescript
// Define clear interfaces in server/types.ts
interface CreateRequestPayload {
  email: string;
  description?: string;
  retentionPolicy: RetentionPolicy;
  reference?: string;
}

interface SubmitSecretPayload {
  secret: string;
  password: string;
}

interface RetrieveSecretPayload {
  password: string;
}
```

### Type Safety

- Export all types from `server/types.ts`
- Use strict TypeScript settings
- Avoid type assertions unless necessary
- Validate data at runtime, not just compile-time

## Error Handling

### Error Response Format

```typescript
res.status(statusCode).json({
  error: 'User-friendly error message',
  details: 'Additional context (non-sensitive)'
});
```

### HTTP Status Codes

- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 404: Not Found
- 429: Too Many Requests (rate limit)
- 500: Internal Server Error

### Error Logging

- Log errors with appropriate detail for debugging
- Never log sensitive data (passwords, secrets, keys)
- Include stack traces in development only
- Use structured logging where possible

## Environment Configuration

### Required Environment Variables

```
SYSTEM_SECRET_KEY=<64 hex characters>
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
EMAIL_PROVIDER=sendgrid|mailgun
SENDGRID_API_KEY=<key>
MAILGUN_API_KEY=<key>
MAILGUN_DOMAIN=<domain>
```

### Configuration Validation

- Validate all required environment variables on startup
- Fail fast if critical config is missing
- Use dotenv for local development
- Never commit .env files

## Testing Guidelines

### Unit Tests

- Test each service method independently
- Mock external dependencies (Redis, email providers)
- Test both success and error paths
- Test edge cases and boundary conditions

### Testing Best Practices

```typescript
// Use Jest for backend testing
describe('CryptoService', () => {
  let cryptoService: CryptoService;
  
  beforeEach(() => {
    cryptoService = new CryptoService(testKey);
  });
  
  it('should encrypt and decrypt data correctly', () => {
    const encrypted = cryptoService.encryptWithSystemKey(testData);
    const decrypted = cryptoService.decryptWithSystemKey(encrypted);
    expect(decrypted).toBe(testData);
  });
});
```

### Integration Tests

- Test API endpoints end-to-end
- Use test Redis instance
- Mock email service in tests
- Clean up test data after each test

## Performance Considerations

### Redis Optimization

- Use connection pooling
- Implement retry logic for transient failures
- Set appropriate TTL values
- Monitor Redis memory usage

### API Performance

- Implement request timeouts
- Use async/await consistently
- Avoid blocking operations
- Monitor response times

## Security Checklist

- [ ] All user inputs are validated
- [ ] Rate limiting is applied to all endpoints
- [ ] Secrets are encrypted before storage
- [ ] Passwords are hashed with PBKDF2
- [ ] Timing-safe comparisons for password verification
- [ ] No sensitive data in logs or error messages
- [ ] CORS is properly configured
- [ ] Environment variables are not exposed
- [ ] Redis connections are secure
- [ ] Email templates don't include sensitive data
