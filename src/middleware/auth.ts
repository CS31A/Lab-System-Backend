import type { AppBindings } from '@/lib/types/app-types'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Note: this is added to fix mismatch between JWT payload and expected
 * JWTPayload from auth service line 103-106 (it works)
 */
interface JWTPayload {
  sub: string // User ID (from AuthService)
  role: string // User type (from AuthService)
  exp: number
}
interface MappedJWTPayload {
  userId: string
  userType: string
  exp: number
}

export function authMiddleware() {
  return createMiddleware<AppBindings>(async (c, next) => {
    const token = getCookie(c, 'accessToken')

    if (!token) {
      c.var.logger.warn('Authentication failed: Missing access token')
      return c.json(
        {
          message: 'Unauthorized: Missing access token',
        },
        httpStatusCodes.UNAUTHORIZED,
      )
    }

    try {
      const payload = await verify(token, c.env.JWT_SECRET) as unknown as JWTPayload
      // Map the actual JWT fields to expected format
      const mappedPayload: MappedJWTPayload = {
        userId: payload.sub,
        userType: payload.role,
        exp: payload.exp,
      }
      c.set('jwtPayload', mappedPayload)
    }
    catch (error) {
      c.var.logger.warn('Authentication failed: Invalid access token', { error: (error as Error).message })
      return c.json(
        {
          message: 'Unauthorized: Invalid access token',
        },
        httpStatusCodes.UNAUTHORIZED,
      )
    }

    await next()
  })
}

export function requireRole(allowedRoles: string[]) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const payload = c.get('jwtPayload') as MappedJWTPayload

    if (!payload) {
      c.var.logger.warn('Role check failed: No JWT payload found')
      return c.json(
        {
          message: 'Unauthorized: Authentication required',
        },
        httpStatusCodes.UNAUTHORIZED,
      )
    }

    if (!allowedRoles.includes(payload.userType)) {
      c.var.logger.warn('Role check failed: Insufficient permissions', {
        userType: payload.userType,
        allowedRoles,
        userId: payload.userId,
      })
      return c.json(
        {
          message: 'Forbidden: Insufficient permissions',
        },
        httpStatusCodes.FORBIDDEN,
      )
    }

    await next()
  })
}
