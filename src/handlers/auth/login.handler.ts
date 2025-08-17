/**
 * @fileoverview Login handler - validates credentials and issues tokens
 * Response shape follows { message, data } convention used across the project.
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { LoginRoute } from '@/routes/auth/auth.routes'
import { setCookie } from 'hono/cookie'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { AuthService } from '@/services/AuthService'

export const LoginHandler: AppRouteHandler<LoginRoute> = async (c) => {
  const { username, password } = c.req.valid('json')

  try {
    const authService = new AuthService(c)
    const { accessToken, refreshToken, user } = await authService.authenticateUser(username, password)

    // Set access token (15 minutes)
    setCookie(c, 'accessToken', accessToken, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 15 * 60,
      path: '/',
    })

    // Set refresh token (7 days)
    setCookie(c, 'refreshToken', refreshToken, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/auth/refresh',
    })

    return c.json(
      {
        message: 'Login successful',
        data: user,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    // Typed error check for authentication failures
    if (err instanceof Error && err.message === 'Invalid credentials') {
      c.var.logger.warn('Authentication failed', err)
      return c.json(
        {
          message: 'Invalid credentials',
        },
        httpStatusCodes.UNAUTHORIZED,
      )
    }
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
