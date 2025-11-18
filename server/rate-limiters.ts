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

/**
 * Request creation rate limiter - 10 requests per 15 minutes
 * Applied to POST /api/requests to prevent request spam
 */
export const requestCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests created, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Secret submission rate limiter - 5 submissions per 15 minutes
 * Applied to POST /api/requests/:id/submit to prevent secret spam
 */
export const secretSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many secret submissions, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Secret retrieval rate limiter - 10 attempts per 15 minutes
 * Applied to POST /api/secrets/:retrievalId to prevent brute force attacks
 */
export const secretRetrievalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many retrieval attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
