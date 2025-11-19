---
applyTo: "{server/crypto.service.ts,server/email.service.ts,server/redis.service.ts}"
---

# Security and Cryptography Instructions

## Critical Security Principles

### Zero Trust Architecture

- **Never trust user input**: Validate and sanitize all inputs
- **Defense in depth**: Multiple layers of security
- **Least privilege**: Grant minimum necessary permissions
- **Fail secure**: Default to secure state on errors

### Data Protection

- **Encryption at rest**: All secrets encrypted in Redis
- **No plain-text storage**: Never store passwords or secrets unencrypted
- **Secure transmission**: HTTPS only in production
- **Key management**: System keys stored in environment variables

## Cryptographic Operations

### AES-256-GCM Encryption

**Algorithm Requirements**:
- Use AES-256-GCM (Galois/Counter Mode)
- Generate new IV (16 bytes) for each encryption
- Use 32-byte (256-bit) keys
- Include authentication tag for integrity verification

**Implementation Pattern**:
```typescript
// Encryption
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;

// Decryption
const [ivHex, tagHex, encryptedHex] = encrypted.split(':');
const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
const decrypted = Buffer.concat([
  decipher.update(Buffer.from(encryptedHex, 'hex')),
  decipher.final()
]);
return decrypted.toString('utf8');
```

### PBKDF2 Password Hashing

**Requirements**:
- Use PBKDF2 with SHA-256
- Minimum 100,000 iterations (current standard)
- Generate unique 32-byte salt per password
- Produce 32-byte derived key

**Implementation Pattern**:
```typescript
// Hash password
const salt = crypto.randomBytes(32);
const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
return `${salt.toString('hex')}:${hash.toString('hex')}`;

// Verify password (timing-safe)
const [saltHex, hashHex] = storedHash.split(':');
const salt = Buffer.from(saltHex, 'hex');
const hash = Buffer.from(hashHex, 'hex');
const derivedHash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
return crypto.timingSafeEqual(hash, derivedHash);
```

## Dual-Layer Encryption Architecture

### Layer 1: System-Level Encryption

**Purpose**: Protect data at rest in Redis
**Method**: AES-256-GCM with system secret key
**Key Storage**: Environment variable `SYSTEM_SECRET_KEY`

**Process**:
1. Generate system key: 64 hex characters (32 bytes)
2. Encrypt all data before Redis storage
3. Decrypt when retrieving from Redis

### Layer 2: User Password Encryption

**Purpose**: Additional user-controlled protection
**Method**: AES-256-GCM with password-derived key
**Key Derivation**: PBKDF2 from user password

**Process**:
1. User provides password
2. Generate salt and derive key with PBKDF2
3. Encrypt already-encrypted data (double encryption)
4. Store password hash separately for verification

## Security Best Practices

### Input Validation

```typescript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('Invalid email format');
}

// Password strength
if (password.length < 8) {
  throw new Error('Password must be at least 8 characters');
}

// Sanitize inputs
const sanitized = input.trim().replace(/[<>]/g, '');
```

### Rate Limiting

**Endpoint Protection**:
```typescript
// General endpoints: 100 requests / 15 minutes
// Sensitive endpoints:
// - POST /api/requests: 10 / 15 minutes
// - POST /api/requests/:id/submit: 5 / 15 minutes
// - POST /api/secrets/:retrievalId: 10 / 15 minutes
```

**Implementation**:
- Use express-rate-limit middleware
- Key by IP address
- Return 429 status on limit exceeded
- Log rate limit violations

### Timing Attack Prevention

**Critical**: Always use timing-safe comparisons for sensitive operations

```typescript
// Correct: Timing-safe comparison
crypto.timingSafeEqual(hash1, hash2);

// Incorrect: Vulnerable to timing attacks
hash1 === hash2; // DON'T USE
```

### Error Handling

**Never expose sensitive information in errors**:

```typescript
// Good: Generic error message
res.status(400).json({ error: 'Invalid credentials' });

// Bad: Exposes implementation details
res.status(400).json({ 
  error: 'Password hash verification failed',
  hash: passwordHash // NEVER DO THIS
});
```

## Secure Logging

### What to Log

- Authentication attempts (success/failure)
- Rate limit violations
- API endpoint access (non-sensitive)
- Service errors (sanitized)
- Email delivery status

### What NOT to Log

- Passwords (plain or hashed)
- Encryption keys
- Secret content
- Full request bodies with sensitive data
- Personal identifiable information (PII)

### Logging Pattern

```typescript
// Good: Safe logging
console.log('Request created', { requestId, timestamp });
console.log('Authentication failed', { ip, endpoint });

// Bad: Unsafe logging
console.log('User password:', password); // NEVER
console.log('Secret content:', secret); // NEVER
console.log('Encryption key:', key); // NEVER
```

## Environment Variable Security

### Required Variables

```bash
# Must be 64 hex characters (32 bytes)
SYSTEM_SECRET_KEY=0123456789abcdef...

# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password

# Email provider credentials
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx
# Or
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxx
MAILGUN_DOMAIN=mg.example.com
```

### Key Generation

```bash
# Generate secure system key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Security Checks

```typescript
// Validate key length
if (systemKey.length !== 64) {
  throw new Error('Invalid system key length');
}

// Check for missing keys
if (!process.env.SYSTEM_SECRET_KEY) {
  throw new Error('SYSTEM_SECRET_KEY is required');
}
```

## Data Retention and Expiration

### Automatic Expiration

- **Maximum TTL**: 10 days (absolute limit)
- **View-based expiration**: 1 or 2 views
- **Time-based expiration**: 3, 5, or 10 days
- **Forced expiration**: After 10 days regardless of policy

### Secure Deletion

```typescript
// Delete from Redis
await redis.del(key);

// Clear from memory
secret = null;
password = null;
```

## Redis Security

### Connection Security

- Use password authentication if available
- Use TLS/SSL in production
- Limit network access to Redis
- Use connection pooling with limits

### Data Storage

```typescript
// Always encrypt before storing
const encrypted = cryptoService.encryptWithSystemKey(data);
await redis.set(key, encrypted, { EX: ttlSeconds });

// Always decrypt after retrieving
const encrypted = await redis.get(key);
const decrypted = cryptoService.decryptWithSystemKey(encrypted);
```

## Email Security

### Safe Email Content

- Never include secrets or passwords in emails
- Use reference fields only
- Sanitize all user-provided content
- Use HTTPS links only

### Email Template Pattern

```typescript
// Safe: Notification with reference
const emailContent = `
New secret submitted for request: ${referenceField}
To view the secret, visit: ${retrievalUrl}
Password was shared separately via secure channel.
`;

// Unsafe: Including sensitive data
const emailContent = `
Password: ${password} // NEVER DO THIS
Secret: ${secret}     // NEVER DO THIS
`;
```

## Security Testing

### Test Cases Required

- [ ] Encryption produces different ciphertext each time
- [ ] Decryption returns original plaintext
- [ ] Invalid keys fail decryption
- [ ] Password verification is timing-safe
- [ ] Rate limiting prevents abuse
- [ ] Invalid inputs are rejected
- [ ] Secrets expire correctly
- [ ] Deleted secrets cannot be retrieved

### Security Review Checklist

- [ ] No plain-text storage of secrets
- [ ] No logging of sensitive data
- [ ] Timing-safe password comparisons
- [ ] Proper IV generation for encryption
- [ ] Secure key derivation (PBKDF2)
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak information
- [ ] Environment variables validated
- [ ] TTL values properly enforced
