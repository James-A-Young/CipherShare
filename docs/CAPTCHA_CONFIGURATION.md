# CAPTCHA Configuration

CipherShare uses Cloudflare Turnstile for CAPTCHA protection to prevent automated abuse. This document explains how to configure and optionally disable CAPTCHA.

## Environment Variables

### `CAPTCHA_ENABLED`
Controls whether CAPTCHA verification is required for creating secret requests and retrieving secrets.

**Values:** `true`, `false`, `1`, `0`, `yes`, `no` (case-insensitive)

**Default:** `true`

**Examples:**
```bash
# Enable CAPTCHA (production recommended)
CAPTCHA_ENABLED=true

# Disable CAPTCHA (development/testing)
CAPTCHA_ENABLED=false
```

### `CF_TURNSTILE_SITEKEY`
The public Cloudflare Turnstile site key. This is exposed to the browser via the `/api/config/metadata` endpoint.

**Required when:** `CAPTCHA_ENABLED=true`

**Example:**
```bash
CF_TURNSTILE_SITEKEY=1x00000000000000000000AA
```

### `CF_TURNSTILE_SECRET`
The secret Cloudflare Turnstile key used to verify tokens on the server.

**Required when:** `CAPTCHA_ENABLED=true`

⚠️ **Keep this private!** Never expose this key to the client.

**Example:**
```bash
CF_TURNSTILE_SECRET=1x0000000000000000000000000000000AA
```

### `CF_TURNSTILE_ALLOWED_HOSTNAMES`
Optional comma-separated list of allowed hostnames that Turnstile tokens must match.

**Optional**

**Example:**
```bash
CF_TURNSTILE_ALLOWED_HOSTNAMES=example.com,app.example.com
```

## How It Works

### When CAPTCHA is Enabled (`CAPTCHA_ENABLED=true`)

1. **Client Side (Request Creation & Secret Retrieval):**
   - The UI fetches configuration from `/api/config/metadata`
   - If CAPTCHA is enabled, the Turnstile widget is loaded and rendered
   - Users must complete the CAPTCHA before submitting a request or retrieving a secret
   - The Turnstile token is included in the request/retrieval payload

2. **Server Side:**
   - The server validates the Turnstile token with Cloudflare for:
     - `POST /api/requests` (creating a new secret request)
     - `POST /api/secrets/:retrievalId` (retrieving a secret)
   - If validation fails, the request is rejected with a 401 error
   - If validation succeeds, the request is processed normally

### When CAPTCHA is Disabled (`CAPTCHA_ENABLED=false`)

1. **Client Side:**
   - The UI fetches configuration from `/api/config/metadata`
   - No CAPTCHA widget is rendered on any page
   - Submit/retrieval buttons are enabled immediately
   - No Turnstile token is sent with requests

2. **Server Side:**
   - The server skips CAPTCHA validation entirely for all endpoints
   - Requests are processed without token verification

## Configuration Examples

### Development (No CAPTCHA)
```bash
CAPTCHA_ENABLED=false
# CF_TURNSTILE_SITEKEY and CF_TURNSTILE_SECRET not needed
```

### Production (With CAPTCHA)
```bash
CAPTCHA_ENABLED=true
CF_TURNSTILE_SITEKEY=1x00000000000000000000AA
CF_TURNSTILE_SECRET=1x0000000000000000000000000000000AA
CF_TURNSTILE_ALLOWED_HOSTNAMES=yourdomain.com,app.yourdomain.com
```

## API Endpoint

### `GET /api/config/metadata`

Returns application configuration metadata.

**Response:**
```json
{
  "captchaEnabled": true,
  "turnstileSiteKey": "1x00000000000000000000AA"
}
```

When CAPTCHA is disabled:
```json
{
  "captchaEnabled": false
}
```

## Protected Endpoints

The following endpoints require CAPTCHA verification when `CAPTCHA_ENABLED=true`:

1. **`POST /api/requests`** - Create a new secret request
2. **`POST /api/secrets/:retrievalId`** - Retrieve a secret

Both endpoints will:
- Return `400 Bad Request` if CAPTCHA is enabled but no token is provided
- Return `401 Unauthorized` if CAPTCHA validation fails with Cloudflare
- Process normally if CAPTCHA is disabled or validation succeeds

## Testing

The test suite includes tests for both CAPTCHA enabled and disabled scenarios:

```bash
npm test
```

Key test cases:
- ✅ Request creation works without CAPTCHA when disabled
- ✅ Secret retrieval works without CAPTCHA when disabled
- ✅ Submit buttons are not disabled when CAPTCHA is disabled
- ✅ No Turnstile token is sent when CAPTCHA is disabled
- ✅ CAPTCHA widget is rendered when enabled
- ✅ Submit buttons are disabled until CAPTCHA is completed when enabled

## Getting Cloudflare Turnstile Keys

1. Sign up for a [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. Navigate to **Turnstile** in the dashboard
3. Create a new site
4. Copy the **Site Key** (public) and **Secret Key** (private)
5. Add them to your `.env` file

## Security Considerations

- **Production:** Always enable CAPTCHA in production to prevent abuse
- **Development:** Disable CAPTCHA for easier local testing
- **Testing:** Disable CAPTCHA in test environments
- **Staging:** Enable CAPTCHA to test the full production flow

## Troubleshooting

### CAPTCHA widget not appearing
- Check that `CAPTCHA_ENABLED=true` in your environment
- Verify `CF_TURNSTILE_SITEKEY` is set correctly
- Check browser console for JavaScript errors

### Token verification failing
- Verify `CF_TURNSTILE_SECRET` is correct
- Check server logs for Turnstile verification errors
- Ensure `CF_TURNSTILE_ALLOWED_HOSTNAMES` matches your domain (if set)

### Button remains disabled
- Check that the Turnstile widget loaded successfully
- Verify the CAPTCHA was completed
- Check browser console for errors
