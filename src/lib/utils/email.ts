/**
 * @fileoverview Email utility functions
 */

/**
 * Masks an email address for logging purposes to protect user privacy
 * Shows first 2 characters of local part followed by *** and the domain
 *
 * @param email - The email address to mask
 * @returns Masked email string (e.g., "ab***@example.com")
 *
 * @example
 * ```typescript
 * maskEmail('user@example.com') // Returns: "us***@example.com"
 * maskEmail('a@example.com')    // Returns: "a***@example.com"
 * maskEmail('invalid')          // Returns: "***@***"
 * ```
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) {
    // Not a valid email format, return a generic masked string
    return '***@***'
  }
  if (localPart.length <= 1) {
    return `${localPart}***@${domain}`
  }
  return `${localPart.substring(0, 2)}***@${domain}`
}
