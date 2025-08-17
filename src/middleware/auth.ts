import type { AppBindings } from '@/lib/types/app-types'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Middleware for authenticating requests using a JWT token from a cookie.
 *
 * @param {AppBindings} c - The Hono context object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<Response | void>} A promise that resolves to a response or void.
 */
export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  // Get the access token from the cookie
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
    c.set('jwtPayload', payload)
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

  // Call the next middleware
  await next()
})
