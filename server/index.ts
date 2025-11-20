import express, { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import crypto from "node:crypto";
import { CryptoService } from "./crypto.service.js";
import { RedisService } from "./redis.service.js";
import { EmailService } from "./email.service.js";
import {
  generalLimiter,
  requestCreationLimiter,
  secretSubmissionLimiter,
  secretRetrievalLimiter,
} from "./rate-limiters.js";
import {
  SecretRequest,
  RequestCreationResponse,
  SecretSubmissionRequest,
  SecretRetrievalRequest,
  SecretRetrievalResponse,
} from "./types.js";
import { verifyTurnstile, isFeatureEnabled } from "./utils.js";
import {
  ValidationError,
  validateEmail,
  validateDescription,
  validateReference,
  validateSecret,
  validatePassword,
  validateRetention,
} from "./validation.js";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SYSTEM_SECRET_KEY', 'EMAIL_FROM'];
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// Validate SYSTEM_SECRET_KEY format
if (!process.env.SYSTEM_SECRET_KEY || process.env.SYSTEM_SECRET_KEY.length !== 64) {
  console.error('❌ CRITICAL: SYSTEM_SECRET_KEY must be exactly 64 hex characters (32 bytes)');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

// Read Cloudflare Turnstile keys from environment
// CF_TURNSTILE_SITEKEY is non-secret and will be exposed to the browser via
// GET /api/config/metadata so the Vite client can initialize the Turnstile widget.
// CF_TURNSTILE_SECRET must remain server-side and is used to verify tokens.
const CF_TURNSTILE_SITEKEY = process.env.CF_TURNSTILE_SITEKEY || "";
const CF_TURNSTILE_SECRET = process.env.CF_TURNSTILE_SECRET || "";
// Optional CSV of allowed hostnames (e.g. "example.com,app.example.com")
const CF_TURNSTILE_ALLOWED_HOSTNAMES = process.env.CF_TURNSTILE_ALLOWED_HOSTNAMES || "";
const allowedHostnames = CF_TURNSTILE_ALLOWED_HOSTNAMES.split(",").map(h => h.trim()).filter(Boolean);
// Feature flag to disable CAPTCHA requirement
const CAPTCHA_ENABLED = isFeatureEnabled(process.env.CAPTCHA_ENABLED ?? "true");

// ESM __dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Hide Express server identifier in responses
app.disable('x-powered-by');
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Trust proxy configuration (important for rate limiting and IP detection)
const proxyLayers = process.env.PROXY_LAYERS 
  ? parseInt(process.env.PROXY_LAYERS) 
  : 1; // Default to 1 for common Docker/K8s setups

if (proxyLayers > 0) {
  app.set('trust proxy', proxyLayers);
  console.log(`🔧 Trusting ${proxyLayers} proxy layer(s)`);
}

// Middleware
// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
      frameSrc: ["https://challenges.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration with origin whitelist
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [CLIENT_URL];
    
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parser with size limits to prevent DoS
app.use(express.json({ 
  limit: '100kb',
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '100kb' 
}));
app.use("/api", generalLimiter); // Apply general rate limiting to all API routes
// Static assets
app.use(express.static(path.join(__dirname, "..", "dist")));

// SPA client-side routing fallback: serve index.html for non-API routes
app.get(/^\/(?!api\/).*/, (req: Request, res: Response, next: Function) => {
  if (/\.[a-zA-Z0-9]+$/.test(req.path)) return next(); // skip real asset files
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});
// Services
// SYSTEM_SECRET_KEY is validated at startup, safe to use directly
const cryptoService = new CryptoService(process.env.SYSTEM_SECRET_KEY!);
const redisService = new RedisService(cryptoService);

// Email service configuration
const emailProvider = (process.env.EMAIL_PROVIDER || "sendgrid").toLowerCase();
const emailService = new EmailService({
  provider: emailProvider as "sendgrid" | "mailgun",
  fromEmail: process.env.EMAIL_FROM || "noreply@ciphershare.app",
  // SendGrid config
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  // Mailgun config
  mailgunApiKey: process.env.MAILGUN_API_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
});

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Expose application metadata and configuration to the client
app.get("/api/config/metadata", (_req: Request, res: Response) => {
  res.json({
    captchaEnabled: CAPTCHA_ENABLED,
    turnstileSiteKey: CAPTCHA_ENABLED ? CF_TURNSTILE_SITEKEY : undefined,
  });
});

// Create a new secret request
app.post(
  "/api/requests",
  requestCreationLimiter,
  async (req: Request, res: Response) => {
    try {
      const {
        requestorEmail,
        description,
        reference,
        retentionType,
        retentionValue,
      } = req.body;

      // Input validation
      try {
        validateEmail(requestorEmail);
        validateDescription(description);
        validateReference(reference);
        validateRetention(retentionType, retentionValue);
      } catch (error) {
        if (error instanceof ValidationError) {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }

      // Validate CAPTCHA if enabled
      if (CAPTCHA_ENABLED) {
        const { turnstileToken } = req.body;
        if (!turnstileToken) {
          return res.status(400).json({ error: "CAPTCHA token is required" });
        }
        const clientIp = req.ip;
        const captchaValid = await verifyTurnstile(
          turnstileToken,
          CF_TURNSTILE_SECRET,
          clientIp,
          allowedHostnames
        );
        if (!captchaValid) {
          return res.status(401).json({ error: "CAPTCHA validation failed" });
        }
      }

      // Generate request ID and retrieval ID upfront
      const requestId = crypto.randomUUID();
      const retrievalId = crypto.randomUUID();

      const secretRequest: SecretRequest = {
        requestId,
        requestorEmail,
        description,
        reference,
        retentionType,
        retentionValue,
        retrievalId,
        status: "pending",
        createdAt: Date.now(),
      };

      await redisService.saveSecretRequest(secretRequest);

      const response: RequestCreationResponse = {
        requestId,
        shareableUrl: `${CLIENT_URL}/request/${requestId}`,
        retrievalUrl: `${CLIENT_URL}/retrieve/${retrievalId}`,
      };

      res.json(response);
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ error: "Failed to create request" });
    }
  }
);

// Get a secret request
app.get("/api/requests/:requestId", async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;

    const request = await redisService.getSecretRequest(requestId);

    if (!request) {
      return res.status(404).json({ error: "Request not found or expired" });
    }

    // Don't send sensitive info back
    const safeRequest = {
      requestId: request.requestId,
      description: request.description,
      status: request.status,
      retentionType: request.retentionType,
      retentionValue: request.retentionValue,
    };

    res.json(safeRequest);
  } catch (error) {
    console.error("Error fetching request:", error);
    res.status(500).json({ error: "Failed to fetch request" });
  }
});

// Submit a secret
app.post(
  "/api/requests/:requestId/submit",
  secretSubmissionLimiter,
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const {
        submitterEmail,
        password,
        confirmPassword,
        secret,
      }: SecretSubmissionRequest = req.body;

      // Input validation
      try {
        validateEmail(submitterEmail);
        validatePassword(password);
        validateSecret(secret);
      } catch (error) {
        if (error instanceof ValidationError) {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      const request = await redisService.getSecretRequest(requestId);

      if (!request) {
        return res.status(404).json({ error: "Request not found or expired" });
      }

      if (request.status === "submitted") {
        return res.status(400).json({ error: "Request already fulfilled" });
      }

      // Use the pre-generated retrieval ID from the request
      const retrievalId = request.retrievalId;

      // Submit the secret
      await redisService.submitSecret(requestId, secret, password, retrievalId);

      // Send email to requestor
      const retrievalUrl = `${CLIENT_URL}/retrieve/${retrievalId}`;
      try {
        await emailService.sendRetrievalLink(
          request.requestorEmail,
          request.description,
          request.reference,
          retrievalUrl
        );
      } catch (emailError) {
        console.error(
          "Email sending failed, but secret was saved:",
          emailError
        );
        // Continue even if email fails
      }

      res.json({
        message: "Secret submitted successfully",
        retrievalUrl, // Also return it in response for testing/backup
      });
    } catch (error) {
      console.error("Error submitting secret:", error);
      res.status(500).json({ error: "Failed to submit secret" });
    }
  }
);

// Retrieve a secret
app.post(
  "/api/secrets/:retrievalId",
  secretRetrievalLimiter,
  async (req: Request, res: Response) => {
    try {
      const { retrievalId } = req.params;
      const { password, turnstileToken }: SecretRetrievalRequest = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      // Validate CAPTCHA if enabled
      if (CAPTCHA_ENABLED) {
        if (!turnstileToken) {
          return res.status(400).json({ error: "CAPTCHA token is required" });
        }
        const clientIp = req.ip;
        const captchaValid = await verifyTurnstile(
          turnstileToken,
          CF_TURNSTILE_SECRET,
          clientIp,
          allowedHostnames
        );
        if (!captchaValid) {
          return res.status(401).json({ error: "CAPTCHA validation failed" });
        }
      }

      const result = await redisService.retrieveSecret(retrievalId, password);

      const response: SecretRetrievalResponse = {
        secret: result.secret,
        viewsRemaining: result.viewsRemaining,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Secret not found or expired") {
          return res.status(404).json({ error: "Secret not found or expired" });
        }
        if (error.message === "Invalid password") {
          return res.status(401).json({ error: "Invalid password" });
        }
        if (error.message === "Secret has expired") {
          return res.status(410).json({ error: "Secret has expired" });
        }
      }
      console.error("Error retrieving secret:", error);
      res.status(500).json({ error: "Failed to retrieve secret" });
    }
  }
);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing server...");
  await redisService.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing server...");
  await redisService.disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🔐 CipherShare API server running on port ${PORT}`);
  console.log(`📡 Client URL: ${CLIENT_URL}`);
});

export default app;
