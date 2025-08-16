import type { Context } from 'hono'
import type { AppBindings } from '@/lib/types/app-types'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import { nanoid } from 'nanoid'
import { createDb } from '@/db'
import { refreshTokens, users } from '@/db/schema'

/**
 * AuthService - Handles authentication, token management, and session control
 *
 * This service manages user authentication using JWT tokens with a refresh token strategy.
 * It provides secure login/logout functionality and token refresh capabilities.
 *
 * Features:
 * - Password verification with bcrypt
 * - JWT access tokens (15-minute expiry)
 * - Refresh tokens (7-day expiry) stored in database
 * - Session management and cleanup
 *
 * @example
 * ```typescript
 * const authService = new AuthService(context)
 *
 * // Authenticate user
 * const { accessToken, refreshToken, user } = await authService.authenticateUser('username', 'password')
 *
 * // Refresh access token
 * const newAccessToken = await authService.issueNewAccessToken(refreshToken)
 *
 * // Logout
 * await authService.invalidateRefreshSession(refreshToken)
 * ```
 */
export class AuthService {
  private db: ReturnType<typeof createDb>
  private c: Context<AppBindings>

  /**
   * Creates a new AuthService instance
   * @param c - Hono context containing database connection and environment variables
   */
  constructor(c: Context<AppBindings>) {
    this.db = createDb(c)
    this.c = c
  }

  /**
   * Authenticates a user with username and password, creating a new session
   *
   * This method performs the following operations:
   * 1. Looks up the user by username
   * 2. Verifies the password using bcrypt
   * 3. Generates a new JWT access token (15-minute expiry)
   * 4. Creates a refresh token session in the database (7-day expiry)
   * 5. Returns tokens and safe user data
   *
   * @param username - The username to authenticate
   * @param passwordFromUser - The plain text password to verify
   *
   * @returns Promise resolving to authentication result
   * @returns result.accessToken - JWT access token for API requests
   * @returns result.refreshToken - Refresh token for obtaining new access tokens
   * @returns result.user - Safe user data (without password)
   * @returns result.user.id - User ID
   * @returns result.user.username - Username
   * @returns result.user.role - User role/type
   *
   * @throws {Error} When username is not found
   * @throws {Error} When password is incorrect
   * @throws {Error} When database operations fail
   *
   * @example
   * ```typescript
   * try {AuthService
   *   const result = await authService.authenticateUser('john_doe', 'myPassword123')
   *   console.log('Login successful for:', result.user.username)
   *   console.log('User role:', result.user.role)
   *
   *   // Store tokens securely (typically in httpOnly cookies)
   *   setSecureCookie('accessToken', result.accessToken)
   *   setSecureCookie('refreshToken', result.refreshToken)
   * } catch (error) {
   *   console.error('Authentication failed:', error.message)
   * }
   * ```
   */
  async authenticateUser(username: string, passwordFromUser: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.username, username),
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(passwordFromUser, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    const accessToken = await sign({
      sub: user.id,
      role: user.user_type,
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    }, this.c.env.JWT_SECRET)

    const refreshToken = nanoid(48)
    const refreshTokenExpiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days

    await this.db.insert(refreshTokens).values({
      user_id: user.id,
      token_hash: refreshToken,
      expires_at: refreshTokenExpiresAt,
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.user_type,
      },
    }
  }

  /**
   * Issues a new access token using a valid refresh token
   *
   * This method validates the refresh token and generates a new access token
   * without requiring the user to re-enter their credentials. It also performs
   * cleanup of expired or invalid refresh tokens.
   *
   * @param refreshToken - The refresh token to validate and exchange
   *
   * @returns Promise resolving to a new JWT access token
   *
   * @throws {Error} When refresh token is not found in database
   * @throws {Error} When refresh token has expired (also removes from database)
   * @throws {Error} When associated user is not found (also removes token)
   * @throws {Error} When JWT signing fails
   *
   * @example
   * ```typescript
   * try {
   *   const newAccessToken = await authService.issueNewAccessToken(refreshToken)
   *   console.log('Access token refreshed successfully')
   *
   *   // Update the access token in secure storage
   *   setSecureCookie('accessToken', newAccessToken)
   * } catch (error) {
   *   console.error('Token refresh failed:', error.message)
   *   // Redirect to login page
   *   redirectToLogin()
   * }
   * ```
   */
  async issueNewAccessToken(refreshToken: string): Promise<string> {
    const session = await this.db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.token_hash, refreshToken),
      with: { user: true },
    })
    if (!session) {
      throw new Error('Invalid refresh token')
    }
    const now = new Date()
    if (now > session.expires_at) {
      await this.db.delete(refreshTokens).where(eq(refreshTokens.id, session.id))
      throw new Error('Refresh token expired')
    }
    const user = session.user
    if (!user) {
      await this.db.delete(refreshTokens).where(eq(refreshTokens.id, session.id))
      throw new Error('User for this session not found')
    }

    const newAccessToken = await sign({
      sub: user.id,
      role: user.user_type,
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    }, this.c.env.JWT_SECRET)
    return newAccessToken
  }

  /**
   * Invalidates a refresh token session (logout)
   *
   * This method removes the refresh token from the database, effectively
   * logging out the user from that specific session. The user will need
   * to authenticate again to get new tokens.
   *
   * @param refreshToken - The refresh token to invalidate
   *
   * @returns Promise that resolves when the session is invalidated
   *
   * @example
   * ```typescript
   * // Logout user
   * await authService.invalidateRefreshSession(refreshToken)
   * console.log('User logged out successfully')
   *
   * // Clear tokens from client storage
   * clearSecureCookie('accessToken')
   * clearSecureCookie('refreshToken')
   *
   * // Redirect to login page
   * redirectToLogin()
   * ```
   *
   * @note This method does not throw errors if the token is not found,
   *       making it safe to call during cleanup operations
   */
  async invalidateRefreshSession(refreshToken: string) {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.token_hash, refreshToken))
  }
}
