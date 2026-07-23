/**
 * Security utilities for input sanitization and validation.
 * Protects against XSS, injection, and malicious content.
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/** Escape HTML special characters to prevent XSS in any text rendered as HTML. */
export function escapeHtml(input: string): string {
  return String(input).replace(/[&<>"'`/=]/g, (ch) => HTML_ENTITY_MAP[ch] ?? ch);
}

/** Strip HTML tags entirely — returns plain text. */
export function stripHtml(input: string): string {
  return String(input).replace(/<[^>]*>/g, '');
}

/** Remove null bytes and control characters that can bypass filters. */
export function stripControlChars(input: string): string {
  return String(input).replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Sanitize a text input: strip HTML tags, control chars, and collapse whitespace.
 * Use on all free-text user input before storing or displaying.
 */
export function sanitizeText(input: string, maxLength = 5000): string {
  return stripControlChars(stripHtml(input)).trim().slice(0, maxLength);
}

/**
 * Validate an email address against a safe RFC-5322 subset.
 * Returns true if the email is structurally valid.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate a password meets minimum security requirements.
 * Requires at least 8 chars, one letter, one number.
 */
export function isStrongPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters long' };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
  return { valid: true };
}

/**
 * Validate and clamp a numeric input to a safe range.
 * Prevents NaN, Infinity, and out-of-bound values from reaching the database.
 */
export function sanitizeNumber(value: unknown, min = 0, max = 1_000_000_000): number | undefined {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return undefined;
  return Math.max(min, Math.min(max, num));
}

/**
 * Validate a URL is from an allowed protocol and domain.
 * Prevents javascript: and data: URLs in image/link fields.
 */
export function isSafeUrl(url: string, allowedDomains?: string[]): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    if (allowedDomains && !allowedDomains.some((d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`))) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limiter for client-side actions (e.g., form submissions).
 * Prevents brute-force and spam by enforcing a minimum interval between calls.
 */
export class RateLimiter {
  private timestamps: Map<string, number> = new Map();
  constructor(private intervalMs: number = 5000) {}

  canProceed(key: string): boolean {
    const now = Date.now();
    const last = this.timestamps.get(key);
    if (last && now - last < this.intervalMs) return false;
    this.timestamps.set(key, now);
    return true;
  }

  remainingMs(key: string): number {
    const last = this.timestamps.get(key);
    if (!last) return 0;
    return Math.max(0, this.intervalMs - (Date.now() - last));
  }
}

/**
 * Detect common SQL injection patterns in text input.
 * Returns true if suspicious patterns are found.
 * This is a defense-in-depth layer — RLS and parameterized queries are the primary protection.
 */
export function detectSqlInjection(input: string): boolean {
  const lowered = input.toLowerCase();
  const patterns = [
    /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b.*\b(from|into|table|database|schema)\b)/,
    /--\s/,
    /\/\*.*\*\//,
    /;\s*(drop|delete|update|insert|alter|create)/,
    /(\bor\b|\band\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/,
  ];
  return patterns.some((p) => p.test(lowered));
}
