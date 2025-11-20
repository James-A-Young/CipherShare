import { createClient, RedisClientType } from "redis";
import { CryptoService } from "./crypto.service.js";
import { SecretRequest, SubmittedSecret } from "./types.js";

const MAX_EXPIRY_DAYS = 10;
const SECONDS_PER_DAY = 86400;

export class RedisService {
  private readonly client: RedisClientType;
  private readonly cryptoService: CryptoService;
  private isConnected: boolean = false;

  constructor(cryptoService: CryptoService) {
    this.cryptoService = cryptoService;
    this.client = createClient({
      url: `redis://${process.env.REDIS_HOST || "localhost"}:${
        process.env.REDIS_PORT || 6379
      }`,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Max Redis reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          const delay = Math.min(retries * 100, 3000);
          console.log(`⏳ Reconnecting to Redis in ${delay}ms (attempt ${retries})...`);
          return delay;
        },
        connectTimeout: 10000,
      }
    });

    this.client.on("error", (err) => {
      console.error('Redis Client Error:', err.message);
    });
    
    this.client.on("reconnecting", () => {
      console.log("🔄 Redis client reconnecting...");
    });
    
    this.client.on("ready", () => {
      console.log("✅ Redis client ready");
    });
    
    this.client.on("connect", () => {
      console.log("🔗 Redis Client Connected");
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  /**
   * Calculate TTL in seconds based on retention settings
   */
  private calculateTTL(
    retentionType: "view" | "time",
    retentionValue: number
  ): number {
    if (retentionType === "time") {
      // Use the specified days, but cap at MAX_EXPIRY_DAYS
      const days = Math.min(retentionValue, MAX_EXPIRY_DAYS);
      return days * SECONDS_PER_DAY;
    }
    // For view-based, still set a max expiry
    return MAX_EXPIRY_DAYS * SECONDS_PER_DAY;
  }

  /**
   * Save a secret request with encryption
   */
  async saveSecretRequest(request: SecretRequest): Promise<void> {
    await this.connect();

    const key = `request:${request.requestId}`;
    const data = JSON.stringify(request);
    const encrypted = this.cryptoService.encryptWithSystemKey(data);

    const ttl = this.calculateTTL(
      request.retentionType,
      request.retentionValue
    );

    await this.client.set(key, encrypted, {
      EX: ttl,
    });
  }

  /**
   * Get a secret request with decryption
   */
  async getSecretRequest(requestId: string): Promise<SecretRequest | null> {
    await this.connect();

    const key = `request:${requestId}`;
    const encrypted = await this.client.get(key);

    if (!encrypted) {
      return null;
    }

    const data = this.cryptoService.decryptWithSystemKey(encrypted);
    return JSON.parse(data);
  }

  /**
   * Submit a secret (dual encrypted) and create retrieval ID
   */
  async submitSecret(
    requestId: string,
    secret: string,
    password: string,
    retrievalId: string
  ): Promise<void> {
    await this.connect();

    // Get the request to determine retention settings
    const request = await this.getSecretRequest(requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status === "submitted") {
      throw new Error("Request already fulfilled");
    }

    // Dual encrypt the secret
    const { encrypted, passwordHash } = this.cryptoService.dualEncrypt(
      secret,
      password
    );

    const submittedSecret: SubmittedSecret = {
      retrievalId,
      requestId,
      encryptedSecret: encrypted,
      passwordHash,
      viewsRemaining:
        request.retentionType === "view" ? request.retentionValue : undefined,
      expiresAt:
        Date.now() +
        this.calculateTTL(request.retentionType, request.retentionValue) * 1000,
      createdAt: Date.now(),
    };

    // Save the submitted secret
    const secretKey = `secret:${retrievalId}`;
    const secretData = JSON.stringify(submittedSecret);
    const encryptedSecretData =
      this.cryptoService.encryptWithSystemKey(secretData);

    const ttl = this.calculateTTL(
      request.retentionType,
      request.retentionValue
    );
    await this.client.set(secretKey, encryptedSecretData, {
      EX: ttl,
    });

    // Update request status
    request.status = "submitted";
    request.submittedAt = Date.now();
    await this.saveSecretRequest(request);
  }

  /**
   * Retrieve and decrypt a secret
   * Implements timing-safe retrieval to prevent timing attacks
   */
  async retrieveSecret(
    retrievalId: string,
    password: string
  ): Promise<{ secret: string; viewsRemaining?: number }> {
    await this.connect();
    const startTime = Date.now();

    try {
      const key = `secret:${retrievalId}`;
      const encrypted = await this.client.get(key);

      if (!encrypted) {
        // Add artificial delay to match valid secret path
        await new Promise(resolve => 
          setTimeout(resolve, 50 + Math.random() * 50)
        );
        throw new Error("Invalid password or secret not found");
      }

      const data = this.cryptoService.decryptWithSystemKey(encrypted);
      const submittedSecret: SubmittedSecret = JSON.parse(data);

      // Check if expired
      if (Date.now() > submittedSecret.expiresAt) {
        await this.client.del(key);
        throw new Error("Secret has expired");
      }

      // Verify password with timing-safe comparison
      const isValidPassword = this.cryptoService.verifyPassword(
        password, 
        submittedSecret.passwordHash
      );

      if (!isValidPassword) {
        throw new Error("Invalid password or secret not found");
      }

      // Decrypt the secret
      const secret = this.cryptoService.dualDecrypt(
        submittedSecret.encryptedSecret,
        password
      );

      // Handle view limit
      if (submittedSecret.viewsRemaining !== undefined) {
        submittedSecret.viewsRemaining -= 1;

        if (submittedSecret.viewsRemaining <= 0) {
          // Delete the secret
          await this.client.del(key);
          return { secret, viewsRemaining: 0 };
        } else {
          // Update the secret with decremented view count
          const updatedData = JSON.stringify(submittedSecret);
          const updatedEncrypted =
            this.cryptoService.encryptWithSystemKey(updatedData);
          const ttl = await this.client.ttl(key);
          await this.client.set(key, updatedEncrypted, {
            EX: ttl > 0 ? ttl : MAX_EXPIRY_DAYS * SECONDS_PER_DAY,
          });
          return { secret, viewsRemaining: submittedSecret.viewsRemaining };
        }
      }

      return { secret };
    } catch (error) {
      // Ensure minimum response time for timing attack protection
      const elapsed = Date.now() - startTime;
      if (elapsed < 100) {
        await new Promise(resolve => 
          setTimeout(resolve, 100 - elapsed)
        );
      }
      throw error;
    }
  }

  /**
   * Delete a request and its associated secret
   */
  async deleteRequest(requestId: string): Promise<void> {
    await this.connect();
    await this.client.del(`request:${requestId}`);
  }

  /**
   * Delete a secret by retrieval ID
   */
  async deleteSecret(retrievalId: string): Promise<void> {
    await this.connect();
    await this.client.del(`secret:${retrievalId}`);
  }
}
