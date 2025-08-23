/**
 * @fileoverview Login handler - validates credentials and issues tokens
 * Response shape follows { message, data } convention used across the project.
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { LoginRoute } from '@/routes/auth/auth.routes'
import { setCookie } from 'hono/cookie'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { AuthService } from '@/services/AuthService'

/**
 * Handles user login. It validates the provided username and password, and if successful,
 * issues an access token and a refresh token, setting them as secure, HTTP-only cookies.
 *
 * @param c - The Hono context, containing the validated request body.
 * @returns A JSON response with user data on success, or an error response on failure.
 */
export const LoginHandler: AppRouteHandler<LoginRoute> = async (c) => {
  // Extract validated username and password from the request
  const { username, password } = c.req.valid('json')

  try {
    // Instantiate the authentication service
    const authService = new AuthService(c)
    // Authenticate the user and generate tokens
    const { accessToken, refreshToken, user } = await authService.authenticateUser(username, password)

    // Set the access token in a secure, HTTP-only cookie with a 15-minute expiry
    setCookie(c, 'accessToken', accessToken, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'Strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    // Set the refresh token in a secure, HTTP-only cookie with a 7-day expiry
    setCookie(c, 'refreshToken', refreshToken, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/auth/refresh', // The refresh token is only sent to the refresh endpoint
    })

    // Return a success response with user data
    return c.json(
      {
        message: 'Login successful',
        data: user,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    // Specifically handle authentication failures
    if (err instanceof Error && err.message === 'Invalid credentials') {
      c.var.logger.warn('Authentication failed', err)
      return c.json(
        {
          message: 'Invalid credentials',
        },
        httpStatusCodes.UNAUTHORIZED,
      )
    }
    // Log any other unexpected errors
    c.var.logger.error('Login handler error', err)
    return c.json(
      {
        message: 'Internal Server Error',
        errors: null,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
