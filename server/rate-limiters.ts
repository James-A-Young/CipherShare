import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";

// Create Redis client for rate limiting
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || "localhost"}:${
    process.env.REDIS_PORT || 6379
  }`,
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.connect().catch((err) => {
  console.error('Rate limiter Redis connection error:', err.message);
});

redisClient.on("error", (err) => {
  console.error("Rate limiter Redis error:", err.message);
});

// Create store factory
const createRedisStore = (prefix: string) => new RedisStore({
  // The function receives individual command arguments as rest parameters
  sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  prefix: `rl:${prefix}:`, // Rate limit prefix with namespace
});

/**
 * General API rate limiter - 100 requests per 15 minutes
 * Applied to all /api/* routes to prevent general abuse
 * Uses Redis for distributed rate limiting
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: createRedisStore('general'),
});

/**
 * Request creation rate limiter - 10 requests per 15 minutes
 * Applied to POST /api/requests to prevent request spam
 * Uses Redis for distributed rate limiting
 */
export const requestCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests created, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('create'),
});

/**
 * Secret submission rate limiter - 5 submissions per 15 minutes
 * Applied to POST /api/requests/:id/submit to prevent secret spam
 * Uses Redis for distributed rate limiting
 */
export const secretSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many secret submissions, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('submit'),
});

/**
 * Secret retrieval rate limiter - 10 attempts per 15 minutes
 * Applied to POST /api/secrets/:retrievalId to prevent brute force attacks
 * Uses Redis for distributed rate limiting
 */
export const secretRetrievalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many retrieval attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('retrieve'),
});
