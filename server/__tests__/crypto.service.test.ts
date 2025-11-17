import { CryptoService } from "../../server/crypto.service";

describe("CryptoService", () => {
  let cryptoService: CryptoService;
  const testSystemKey =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const testPassword = "TestPassword123!";
  const testData = "This is a secret message";

  beforeEach(() => {
    cryptoService = new CryptoService(testSystemKey);
  });

  describe("System Key Encryption", () => {
    it("should encrypt and decrypt data with system key", () => {
      const encrypted = cryptoService.encryptWithSystemKey(testData);
      expect(encrypted).not.toBe(testData);
      expect(encrypted).toContain(":"); // Format: iv:tag:encrypted

      const decrypted = cryptoService.decryptWithSystemKey(encrypted);
      expect(decrypted).toBe(testData);
    });

    it("should produce different encrypted output each time", () => {
      const encrypted1 = cryptoService.encryptWithSystemKey(testData);
      const encrypted2 = cryptoService.encryptWithSystemKey(testData);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should throw error on invalid encrypted data", () => {
      expect(() => {
        cryptoService.decryptWithSystemKey("invalid:data");
      }).toThrow();
    });
  });

  describe("Password-Based Encryption", () => {
    it("should encrypt and decrypt data with password", () => {
      const { encrypted, passwordHash } = cryptoService.encryptWithPassword(
        testData,
        testPassword
      );
      expect(encrypted).not.toBe(testData);
      expect(passwordHash).toBeTruthy();

      const decrypted = cryptoService.decryptWithPassword(
        encrypted,
        testPassword
      );
      expect(decrypted).toBe(testData);
    });

    it("should verify password correctly", () => {
      const { passwordHash } = cryptoService.encryptWithPassword(
        testData,
        testPassword
      );
      expect(cryptoService.verifyPassword(testPassword, passwordHash)).toBe(
        true
      );
      expect(cryptoService.verifyPassword("WrongPassword", passwordHash)).toBe(
        false
      );
    });

    it("should throw error with wrong password", () => {
      const { encrypted } = cryptoService.encryptWithPassword(
        testData,
        testPassword
      );
      expect(() => {
        cryptoService.decryptWithPassword(encrypted, "WrongPassword");
      }).toThrow();
    });
  });

  describe("Dual Encryption", () => {
    it("should encrypt and decrypt with dual encryption", () => {
      const { encrypted, passwordHash } = cryptoService.dualEncrypt(
        testData,
        testPassword
      );
      expect(encrypted).not.toBe(testData);
      expect(passwordHash).toBeTruthy();

      const decrypted = cryptoService.dualDecrypt(encrypted, testPassword);
      expect(decrypted).toBe(testData);
    });

    it("should fail decryption with wrong password", () => {
      const { encrypted } = cryptoService.dualEncrypt(testData, testPassword);
      expect(() => {
        cryptoService.dualDecrypt(encrypted, "WrongPassword");
      }).toThrow();
    });

    it("should produce different encrypted output each time", () => {
      const { encrypted: encrypted1 } = cryptoService.dualEncrypt(
        testData,
        testPassword
      );
      const { encrypted: encrypted2 } = cryptoService.dualEncrypt(
        testData,
        testPassword
      );
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe("Password Hashing", () => {
    it("should hash password", () => {
      const hash = cryptoService.hashPassword(testPassword);
      expect(hash).toBeTruthy();
      expect(hash).toContain(":"); // Format: salt:hash
    });

    it("should produce different hashes each time", () => {
      const hash1 = cryptoService.hashPassword(testPassword);
      const hash2 = cryptoService.hashPassword(testPassword);
      expect(hash1).not.toBe(hash2);
    });

    it("should verify password against hash", () => {
      const hash = cryptoService.hashPassword(testPassword);
      expect(cryptoService.verifyPassword(testPassword, hash)).toBe(true);
      expect(cryptoService.verifyPassword("WrongPassword", hash)).toBe(false);
    });
  });
});
