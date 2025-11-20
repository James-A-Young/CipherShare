import validator from 'validator';

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate email address format and length
 */
export function validateEmail(email: string): void {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required');
  }
  
  if (!validator.isEmail(email, { allow_display_name: false })) {
    throw new ValidationError('Invalid email address format');
  }
  
  if (email.length > 254) { // RFC 5321
    throw new ValidationError('Email address too long');
  }
}

/**
 * Validate description text
 */
export function validateDescription(description: string): void {
  if (!description || typeof description !== 'string') {
    throw new ValidationError('Description is required');
  }
  
  if (description.length > 2000) {
    throw new ValidationError('Description must not exceed 2000 characters');
  }
  
  // Sanitize HTML/script tags
  const sanitized = validator.escape(description);
  if (sanitized !== description) {
    throw new ValidationError('Description contains invalid characters');
  }
}

/**
 * Validate optional reference field
 */
export function validateReference(reference?: string): void {
  if (reference) {
    if (typeof reference !== 'string') {
      throw new ValidationError('Reference must be a string');
    }
    
    if (reference.length > 100) {
      throw new ValidationError('Reference must not exceed 100 characters');
    }
    
    const sanitized = validator.escape(reference);
    if (sanitized !== reference) {
      throw new ValidationError('Reference contains invalid characters');
    }
  }
}

/**
 * Validate secret content
 */
export function validateSecret(secret: string): void {
  if (!secret || typeof secret !== 'string') {
    throw new ValidationError('Secret is required');
  }
  
  if (secret.length > 50000) { // ~50KB
    throw new ValidationError('Secret must not exceed 50KB');
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required');
  }
  
  if (password.length < 12) {
    throw new ValidationError('Password must be at least 12 characters');
  }
  
  if (password.length > 128) {
    throw new ValidationError('Password must not exceed 128 characters');
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const complexityMet = [hasUppercase, hasLowercase, hasNumber, hasSpecial]
    .filter(Boolean).length >= 3;
  
  if (!complexityMet) {
    throw new ValidationError(
      'Password must contain at least 3 of: uppercase letter, lowercase letter, number, special character'
    );
  }
}

/**
 * Validate retention settings
 */
export function validateRetention(
  retentionType: string,
  retentionValue: number
): void {
  if (retentionType !== "view" && retentionType !== "time") {
    throw new ValidationError('Invalid retention type. Must be "view" or "time"');
  }

  if (typeof retentionValue !== 'number' || isNaN(retentionValue)) {
    throw new ValidationError('Retention value must be a number');
  }

  if (retentionType === "view" && ![1, 2].includes(retentionValue)) {
    throw new ValidationError('View limit must be 1 or 2');
  }

  if (retentionType === "time" && ![3, 5, 10].includes(retentionValue)) {
    throw new ValidationError('Time limit must be 3, 5, or 10 days');
  }
}
