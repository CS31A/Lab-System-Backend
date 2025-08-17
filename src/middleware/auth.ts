import type { AppBindings } from '@/lib/types/app-types'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import * as httpStatusCodes from '@/openapi/http-status-codes'

interface JWTPayload {
  sub: string
  role: string
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
      c.set('jwtPayload', payload)
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
    const payload = c.get('jwtPayload') as JWTPayload

    if (!payload) {
      c.var.logger.warn('Role check failed: No JWT payload found')
      return c.json(
        {
          message: 'Unauthorized: Authentication required',
        },
        httpStatusCodes.UNAUTHORIZED,
      )
    }

    if (!allowedRoles.includes(payload.role)) {
      c.var.logger.warn('Role check failed: Insufficient permissions', {
        userType: payload.role,
        allowedRoles,
        userId: payload.sub,
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
