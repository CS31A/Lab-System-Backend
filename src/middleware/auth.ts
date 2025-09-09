import type { z } from '@hono/zod-openapi'
import type { AppBindings } from '@/lib/types/app-types'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import { jwtPayloadSchema } from '@/lib/zod-schemas'
import * as httpStatusCodes from '@/openapi/http-status-codes'

export type JWTPayload = z.infer<typeof jwtPayloadSchema>

/**
 * Middleware for authenticating requests using a JWT token from a cookie.
 *
 * @param {AppBindings} c - The Hono context object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<Response | void>} A promise that resolves to a response or void.
 */
export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const token = getCookie(c, 'accessToken')

  // If the token is missing, return an unauthorized response
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
    // Verify the token and set the payload in the context
    const payload = await verify(token, c.env.JWT_SECRET)
    const validatedPayload = jwtPayloadSchema.parse(payload)
    c.set('jwtPayload', validatedPayload)
  }
  catch (error) {
    // If the token is invalid, return an unauthorized response
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

    c.var.logger.warn('\nThis is the role of the user  ', payload.role)
    c.var.logger.warn('\nThese are the allowed roles: ', allowedRoles)

    // Validate the payload structure
    try {
      jwtPayloadSchema.parse(payload)

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
    }
    catch (error) {
      c.var.logger.warn('Role check failed: Invalid JWT payload structure', { error: (error as Error).message })
      return c.json(
        {
          message: 'Unauthorized: Invalid token structure',
        },
        httpStatusCodes.UNAUTHORIZED,
      )
    }

    await next()
  })
}

export const adminOnlyForNonGet = createMiddleware<AppBindings>(async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'OPTIONS')
    return next()
  return requireRole(['admin'])(c, next)
})

/**
 * Factory function that creates middleware to restrict access based on path, method, and required roles.
 *
 * @param paths - Array of exact paths to protect (e.g., ['/users', '/admin'])
 * @param methods - Array of HTTP methods to protect (e.g., ['GET', 'POST'])
 * @param roles - Array of roles that are allowed access (e.g., ['admin'])
 * @returns Middleware function
 */
export function createPathRoleMiddleware(
  paths: string[],
  methods: string[],
  roles: string[],
) {
  return createMiddleware<AppBindings>(async (c, next) => {
    // Check if current path and method match the protected ones
    if (paths.includes(c.req.path) && methods.includes(c.req.method))
      return requireRole(roles)(c, next)
    return next()
  })
}

/**
 * Middleware that restricts access to the GET /users endpoint to admin users only.
 * Does not affect nested paths like /users/123.
 *
 * This is now implemented using the more flexible createPathRoleMiddleware factory.
 */
export const adminOnlyUsersListGet = createPathRoleMiddleware(
  ['/users'], // Protected paths
  ['GET'], // Protected methods
  ['admin'], // Required roles
)
