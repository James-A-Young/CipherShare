import express, { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
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

dotenv.config();

// ESM __dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

if (process.env.PROXY_LAYERS) {
    app.set('trust proxy', parseInt(process.env.PROXY_LAYERS));
}
// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", generalLimiter); // Apply general rate limiting to all API routes
// Static assets
app.use(express.static(path.join(__dirname, "..", "dist")));

// SPA client-side routing fallback: serve index.html for non-API routes
app.get(/^\/(?!api\/).*/, (req: Request, res: Response, next: Function) => {
  if (/\.[a-zA-Z0-9]+$/.test(req.path)) return next(); // skip real asset files
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});
// Services
const cryptoService = new CryptoService(
  process.env.SYSTEM_SECRET_KEY ||
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
);
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
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now(), source: req.ip});
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

      // Validation
      if (
        !requestorEmail ||
        !description ||
        !retentionType ||
        !retentionValue
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (retentionType !== "view" && retentionType !== "time") {
        return res.status(400).json({ error: "Invalid retention type" });
      }

      if (retentionType === "view" && ![1, 2].includes(retentionValue)) {
        return res.status(400).json({ error: "View limit must be 1 or 2" });
      }

      if (retentionType === "time" && ![3, 5, 10].includes(retentionValue)) {
        return res
          .status(400)
          .json({ error: "Time limit must be 3, 5, or 10 days" });
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

      // Validation
      if (!submitterEmail || !password || !confirmPassword || !secret) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
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
      const { password }: SecretRetrievalRequest = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password is required" });
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
  console.log(` redis pass ${}`)
});

export default app;
