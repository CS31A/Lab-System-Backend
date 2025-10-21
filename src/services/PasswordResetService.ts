/**
 * @fileoverview PasswordResetService - Handles secure password reset functionality
 * Implements token-based password reset with time expiration and single-use tokens
 */

import type { Context } from 'hono'
import type { AppBindings } from '@/lib/types/app-types'
import bcrypt from 'bcryptjs'
import { and, eq, lt } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { createDb } from '@/db'
import { passwordResetTokens, users } from '@/db/schema'
import { EmailService } from './EmailService'

export interface PasswordResetRequest {
    email: string
}

export interface PasswordResetConfirm {
    token: string
    newPassword: string
}

/**
 * PasswordResetService - Manages secure password reset operations
 * 
 * Features:
 * - Secure token generation using selector/verifier pattern
 * - Time-limited tokens (configurable expiry)
 * - Single-use tokens (marked as used after consumption)
 * - Automatic cleanup of expired tokens
 * - Email notifications with secure reset links
 * 
 * Security measures:
 * - Tokens are split into public selector and secret verifier
 * - Only verifier hash is stored in database
 * - Constant-time token validation
 * - Rate limiting friendly (no user enumeration)
 * 
 * @example
 * ```typescript
 * const resetService = new PasswordResetService(context)
 * 
 * // Request password reset
 * await resetService.requestPasswordReset({ email: 'user@example.com' })
 * 
 * // Reset password with token
 * await resetService.resetPassword({
 *   token: 'selector.verifier',
 *   newPassword: 'newSecurePassword123'
 * })
 * ```
 */
export class PasswordResetService {
    private db: ReturnType<typeof createDb>
    private emailService: EmailService
    private c: Context<AppBindings>
    private logger: any

    constructor(c: Context<AppBindings>) {
        this.db = createDb(c)
        this.emailService = new EmailService(c)
        this.c = c
        this.logger = c.var.logger
    }

    /**
     * Initiates a password reset request for a user
     * 
     * This method:
     * 1. Validates the email and finds the user
     * 2. Generates a secure reset token
     * 3. Stores the token hash in the database
     * 4. Sends a reset email to the user
     * 5. Cleans up expired tokens
     * 
     * @param request - Password reset request data
     * @param request.email - Email address of the user requesting reset
     * 
     * @returns Promise that resolves when reset email is sent
     * 
     * @throws {Error} When user is not found (for security, same response as success)
     * @throws {Error} When email sending fails
     * @throws {Error} When database operations fail
     * 
     * @example
     * ```typescript
     * try {
     *   await resetService.requestPasswordReset({ email: 'user@example.com' })
     *   console.log('Reset email sent successfully')
     * } catch (error) {
     *   console.error('Reset request failed:', error.message)
     * }
     * ```
     * 
     * @security This method does not reveal whether a user exists to prevent user enumeration
     */
    async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
        const { email } = request

        // Clean up expired tokens first
        await this.cleanupExpiredTokens()

        // Find user by email (only active users)
        const user = await this.db.query.users.findFirst({
            where: and(
                eq(users.email, email.toLowerCase()),
                eq(users.is_deleted, false)
            ),
        })

        // For security, we don't reveal if user exists or not
        // Always return success to prevent user enumeration attacks
        if (!user) {
            this.logger.warn('Password reset requested for non-existent user', {
                email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
                timestamp: new Date().toISOString(),
            })

            // Simulate processing time to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
            return
        }

        // Generate secure token using selector/verifier pattern
        const selector = nanoid(12) // Public part for database lookups
        const verifier = nanoid(48) // Secret part sent to user
        const resetToken = `${selector}.${verifier}` // Combined token for user

        // Hash only the verifier part for database storage
        const bcryptCost = Number.parseInt(this.c.env.BCRYPT_COST || '10')
        const tokenHash = await bcrypt.hash(verifier, bcryptCost)

        // Calculate expiry time
        const expiryHours = Number.parseInt(this.c.env.RESET_TOKEN_EXPIRY_HOURS || '1')
        const expiresAt = new Date(Date.now() + (expiryHours * 60 * 60 * 1000))

        try {
            // Store token in database
            await this.db.insert(passwordResetTokens).values({
                user_id: user.id,
                selector,
                token_hash: tokenHash,
                expires_at: expiresAt,
            })

            // Generate reset URL
            const resetUrl = `${this.c.env.APP_URL}/reset-password?token=${resetToken}`

            // Send reset email
            await this.emailService.sendPasswordResetEmail(user.email, {
                username: user.username,
                resetUrl,
                expiryHours,
            })

            this.logger.info('Password reset token generated and email sent', {
                user_id: user.id,
                username: user.username,
                email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
                expires_at: expiresAt.toISOString(),
                timestamp: new Date().toISOString(),
            })

        } catch (error) {
            this.logger.error('Failed to process password reset request', {
                user_id: user.id,
                email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
                error: (error as Error).message,
                timestamp: new Date().toISOString(),
            })
            throw new Error('Failed to process password reset request')
        }
    }

    /**
     * Resets a user's password using a valid reset token
     * 
     * This method:
     * 1. Validates the reset token format and expiry
     * 2. Verifies the token against the database
     * 3. Updates the user's password
     * 4. Marks the token as used
     * 5. Cleans up expired tokens
     * 
     * @param resetData - Password reset confirmation data
     * @param resetData.token - The reset token from the email link
     * @param resetData.newPassword - The new password to set
     * 
     * @returns Promise that resolves when password is successfully reset
     * 
     * @throws {Error} When token format is invalid
     * @throws {Error} When token is not found, expired, or already used
     * @throws {Error} When user account is not found or deactivated
     * @throws {Error} When password update fails
     * 
     * @example
     * ```typescript
     * try {
     *   await resetService.resetPassword({
     *     token: 'abc123def456.xyz789uvw012',
     *     newPassword: 'NewSecurePassword123!'
     *   })
     *   console.log('Password reset successfully')
     * } catch (error) {
     *   console.error('Password reset failed:', error.message)
     * }
     * ```
     */
    async resetPassword(resetData: PasswordResetConfirm): Promise<void> {
        const { token, newPassword } = resetData

        // Clean up expired tokens first
        await this.cleanupExpiredTokens()

        // Validate token format
        const parts = token.split('.')
        if (parts.length !== 2) {
            throw new Error('Invalid reset token format')
        }

        const [selector, verifier] = parts
        if (!selector || !verifier) {
            throw new Error('Invalid reset token')
        }

        const now = new Date()

        // Find all tokens by selector and filter in JavaScript
        const allTokens = await this.db.query.passwordResetTokens.findMany({
            where: eq(passwordResetTokens.selector, selector),
            with: { user: true },
        })

        // Filter valid tokens (not expired, not used)
        const validTokens = allTokens.filter(t =>
            t.expires_at >= now && !t.used_at
        )

        if (validTokens.length === 0) {
            this.logger.warn('Invalid or expired reset token used', {
                selector,
                timestamp: new Date().toISOString(),
            })
            throw new Error('Invalid or expired reset token')
        }

        const tokenRecord = validTokens[0]

        // Verify the secret verifier part
        const isValidToken = await bcrypt.compare(verifier, tokenRecord.token_hash)
        if (!isValidToken) {
            this.logger.warn('Reset token verification failed', {
                selector,
                user_id: tokenRecord.user_id,
                timestamp: new Date().toISOString(),
            })
            throw new Error('Invalid reset token')
        }

        // Check if user still exists and is active
        const user = tokenRecord.user
        if (!user || user.is_deleted) {
            // Mark token as used even if user is deleted
            await this.db
                .update(passwordResetTokens)
                .set({ used_at: now })
                .where(eq(passwordResetTokens.id, tokenRecord.id))

            throw new Error('User account not found or deactivated')
        }

        try {
            // Hash the new password
            const bcryptCost = Number.parseInt(this.c.env.BCRYPT_COST || '10')
            const hashedPassword = await bcrypt.hash(newPassword, bcryptCost)

            // Update user password and mark token as used in a transaction-like operation
            await Promise.all([
                this.db
                    .update(users)
                    .set({
                        password: hashedPassword,
                        updated_at: now
                    })
                    .where(eq(users.id, user.id)),

                this.db
                    .update(passwordResetTokens)
                    .set({ used_at: now })
                    .where(eq(passwordResetTokens.id, tokenRecord.id))
            ])

            this.logger.info('Password reset completed successfully', {
                user_id: user.id,
                username: user.username,
                token_id: tokenRecord.id,
                timestamp: new Date().toISOString(),
            })

        } catch (error) {
            this.logger.error('Failed to reset password', {
                user_id: user.id,
                token_id: tokenRecord.id,
                error: (error as Error).message,
                timestamp: new Date().toISOString(),
            })
            throw new Error('Failed to reset password')
        }
    }

    /**
     * Validates a reset token without consuming it
     * 
     * This method checks if a token is valid and not expired without marking it as used.
     * Useful for validating tokens on the reset password form before submission.
     * 
     * @param token - The reset token to validate
     * 
     * @returns Promise resolving to validation result
     * @returns result.valid - Whether the token is valid
     * @returns result.user - User information if token is valid
     * @returns result.expiresAt - When the token expires
     * 
     * @example
     * ```typescript
     * const validation = await resetService.validateResetToken('abc123.def456')
     * if (validation.valid) {
     *   console.log('Token is valid for user:', validation.user?.username)
     *   console.log('Expires at:', validation.expiresAt)
     * } else {
     *   console.log('Token is invalid or expired')
     * }
     * ```
     */
    async validateResetToken(token: string): Promise<{
        valid: boolean
        user?: typeof users.$inferSelect
        expiresAt?: Date
    }> {
        // Validate token format
        const parts = token.split('.')
        if (parts.length !== 2) {
            return { valid: false }
        }

        const [selector, verifier] = parts
        if (!selector || !verifier) {
            return { valid: false }
        }

        const now = new Date()

        try {
            // Find all tokens by selector
            const allTokens = await this.db.query.passwordResetTokens.findMany({
                where: eq(passwordResetTokens.selector, selector),
                with: { user: true },
            })

            if (allTokens.length === 0) {
                return { valid: false }
            }

            // Filter valid tokens (not expired, not used) in JavaScript
            const validTokens = allTokens.filter(t =>
                t.expires_at >= now && !t.used_at
            )

            if (validTokens.length === 0) {
                return { valid: false }
            }

            const tokenRecord = validTokens[0]

            // Verify the verifier part
            const isValidToken = await bcrypt.compare(verifier, tokenRecord.token_hash)
            if (!isValidToken) {
                return { valid: false }
            }

            // Check if user is still active
            const user = tokenRecord.user
            if (!user || user.is_deleted) {
                return { valid: false }
            }

            return {
                valid: true,
                user,
                expiresAt: tokenRecord.expires_at,
            }

        } catch (error) {
            this.logger.error('Error validating reset token', {
                selector,
                error: (error as Error).message,
                stack: (error as Error).stack,
                timestamp: new Date().toISOString(),
            })
            return { valid: false }
        }
    }

    /**
     * Cleans up expired and used password reset tokens
     * 
     * This method removes old tokens from the database to maintain performance
     * and security. Should be called periodically or before token operations.
     * 
     * @returns Promise that resolves when cleanup is complete
     * 
     * @example
     * ```typescript
     * await resetService.cleanupExpiredTokens()
     * console.log('Expired tokens cleaned up')
     * ```
     */
    async cleanupExpiredTokens(): Promise<void> {
        const now = new Date()

        try {
            // Delete expired tokens and tokens used more than 24 hours ago
            const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000))

            await this.db.delete(passwordResetTokens).where(
                and(
                    lt(passwordResetTokens.expires_at, now),
                    // Also clean up old used tokens
                    lt(passwordResetTokens.used_at, oneDayAgo)
                )
            )

            this.logger.debug('Expired password reset tokens cleaned up', {
                timestamp: new Date().toISOString(),
            })

        } catch (error) {
            this.logger.error('Failed to cleanup expired tokens', {
                error: (error as Error).message,
                timestamp: new Date().toISOString(),
            })
        }
    }

    /**
     * Revokes all password reset tokens for a specific user
     * 
     * This method marks all active tokens for a user as used, effectively
     * invalidating them. Useful when a user's account is compromised or
     * when they successfully reset their password through other means.
     * 
     * @param userId - The ID of the user whose tokens should be revoked
     * 
     * @returns Promise that resolves when tokens are revoked
     * 
     * @example
     * ```typescript
     * await resetService.revokeUserTokens('user123')
     * console.log('All reset tokens for user revoked')
     * ```
     */
    async revokeUserTokens(userId: string): Promise<void> {
        const now = new Date()

        try {
            await this.db
                .update(passwordResetTokens)
                .set({ used_at: now })
                .where(
                    and(
                        eq(passwordResetTokens.user_id, userId),
                        eq(passwordResetTokens.used_at, null as any)
                    )
                )

            this.logger.info('All password reset tokens revoked for user', {
                user_id: userId,
                timestamp: new Date().toISOString(),
            })

        } catch (error) {
            this.logger.error('Failed to revoke user tokens', {
                user_id: userId,
                error: (error as Error).message,
                timestamp: new Date().toISOString(),
            })
            throw error
        }
    }
}