/**
 * @fileoverview Email utility functions
 */

/**
 * Masks an email address for logging purposes to protect user privacy
 * Always shows exactly 2 characters of local part followed by *** and the domain
 *
 * @param email - The email address to mask
 * @returns Masked email string (e.g., "ab***@example.com")
 *
 * @example
 * ```typescript
 * maskEmail('user@example.com') // Returns: "us***@example.com"
 * maskEmail('a@example.com')    // Returns: "a****@example.com" (padded)
 * maskEmail('ab@example.com')   // Returns: "ab***@example.com"
 * maskEmail('invalid')          // Returns: "***"
 * ```
 */
export function maskEmail(email: string): string {
  if (!email.includes('@')) {
    // Not a valid email format, return a generic masked string
    return '***'
  }
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) {
    return '***'
  }
  // Always show exactly 2 characters (or pad if shorter)
  const prefix = localPart.length >= 2 ? localPart.substring(0, 2) : localPart.padEnd(2, '*')
  return `${prefix}***@${domain}`
}
