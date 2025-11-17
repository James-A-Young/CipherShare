import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export class CryptoService {
  private systemKey: Buffer;

  constructor(systemSecretKey: string) {
    // Convert hex string to buffer
    this.systemKey = Buffer.from(systemSecretKey, "hex");
    if (this.systemKey.length !== KEY_LENGTH) {
      throw new Error("System secret key must be 32 bytes (64 hex characters)");
    }
  }

  /**
   * Derive a key from a password using PBKDF2
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256");
  }

  /**
   * Generate a hash of the password for verification
   */
  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = this.deriveKey(password, salt);
    return salt.toString("hex") + ":" + hash.toString("hex");
  }

  /**
   * Verify a password against its hash
   */
  public verifyPassword(password: string, storedHash: string): boolean {
    const [saltHex, hashHex] = storedHash.split(":");
    const salt = Buffer.from(saltHex, "hex");
    const hash = Buffer.from(hashHex, "hex");
    const derivedHash = this.deriveKey(password, salt);
    return crypto.timingSafeEqual(hash, derivedHash);
  }

  /**
   * Encrypt data with a key using AES-256-GCM
   */
  private encryptWithKey(data: string, key: Buffer): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    // Return: iv:tag:encrypted
    return iv.toString("hex") + ":" + tag.toString("hex") + ":" + encrypted;
  }

  /**
   * Decrypt data with a key using AES-256-GCM
   */
  private decryptWithKey(encryptedData: string, key: Buffer): string {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Layer 1: Encrypt with system key
   */
  public encryptWithSystemKey(data: string): string {
    return this.encryptWithKey(data, this.systemKey);
  }

  /**
   * Layer 1: Decrypt with system key
   */
  public decryptWithSystemKey(encryptedData: string): string {
    return this.decryptWithKey(encryptedData, this.systemKey);
  }

  /**
   * Layer 2: Encrypt with user password
   */
  public encryptWithPassword(
    data: string,
    password: string
  ): { encrypted: string; passwordHash: string } {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = this.deriveKey(password, salt);
    const encrypted = this.encryptWithKey(data, key);

    // Store salt with encrypted data
    const encryptedWithSalt = salt.toString("hex") + ":" + encrypted;

    // Create a separate hash for password verification
    const passwordHash = this.hashPassword(password);

    return { encrypted: encryptedWithSalt, passwordHash };
  }

  /**
   * Layer 2: Decrypt with user password
   */
  public decryptWithPassword(encryptedData: string, password: string): string {
    const parts = encryptedData.split(":");
    if (parts.length < 4) {
      throw new Error("Invalid encrypted data format");
    }

    const salt = Buffer.from(parts[0], "hex");
    const encryptedPayload = parts.slice(1).join(":");

    const key = this.deriveKey(password, salt);
    return this.decryptWithKey(encryptedPayload, key);
  }

  /**
   * Dual encryption: First with password, then with system key
   */
  public dualEncrypt(
    data: string,
    password: string
  ): { encrypted: string; passwordHash: string } {
    const { encrypted: passwordEncrypted, passwordHash } =
      this.encryptWithPassword(data, password);
    const systemEncrypted = this.encryptWithSystemKey(passwordEncrypted);
    return { encrypted: systemEncrypted, passwordHash };
  }

  /**
   * Dual decryption: First with system key, then with password
   */
  public dualDecrypt(encryptedData: string, password: string): string {
    const systemDecrypted = this.decryptWithSystemKey(encryptedData);
    return this.decryptWithPassword(systemDecrypted, password);
  }
}
