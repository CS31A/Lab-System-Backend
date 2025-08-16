import type { Context } from 'hono'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { users, refreshTokens } from '@/db/schema'
import { sign } from 'hono/jwt'
import { nanoid } from 'nanoid'
import type { AppBindings } from '@/lib/types/app-types'

/**
 * AuthService
 * - authenticateUser: verify credentials and create a refresh session
 * - issueNewAccessToken: verify refresh token and mint a new access token
 * - invalidateRefreshSession: remove refresh session (logout)
 */
export class AuthService {
  private db: ReturnType<typeof createDb>
  private c: Context<AppBindings>

  constructor(c: Context<AppBindings>) {
    this.db = createDb(c)
    this.c = c
  }

  /**
   * Verifies username/password, creates a refresh session, and returns tokens with safe user payload
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
   * Validates a refresh token session and returns a new short-lived access token
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
   * Deletes the refresh session for the provided token (logout)
   */
  async invalidateRefreshSession(refreshToken: string) {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.token_hash, refreshToken))
  }
}


