/**
 * @fileoverview Refresh handler - issues a new short-lived access token using a valid refresh token cookie
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { RefreshRoute } from '@/routes/auth/auth.routes'
import { getCookie, setCookie } from 'hono/cookie'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { AuthService } from '@/services/AuthService'

/**
 * Handles access token renewal. It uses the refresh token (from an HTTP-only cookie)
 * to issue a new access token, which is then set in a new cookie.
 *
 * @param c - The Hono context, containing the refresh token cookie.
 * @returns A JSON response confirming the token refresh, or an error response.
 */
export const RefreshHandler: AppRouteHandler<RefreshRoute> = async (c) => {
  // Get the refresh token from the HTTP-only cookie
  const refreshToken = getCookie(c, 'refreshToken')

  if (!refreshToken) {
    return c.json(
      {
        message: 'Unauthorized',
        error: 'Refresh token is missing',
      },
      httpStatusCodes.UNAUTHORIZED,
    )
  }
  try {
    // Instantiate the authentication service
    const authService = new AuthService(c)
    // Issue a new access token using the refresh token
    const newAccessToken = await authService.issueNewAccessToken(refreshToken)

    // Set the new access token in a secure, HTTP-only cookie
    setCookie(c, 'accessToken', newAccessToken, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    return c.json({ message: 'Access token refreshed' }, httpStatusCodes.OK)
  }
  catch (err) {
    // Handle cases where the refresh token is invalid or expired
    if (err instanceof Error && (err.message === 'Invalid refresh token' || err.message === 'Refresh token expired')) {
      c.var.logger.warn('Refresh token invalid or expired', err)
      return c.json(
        { message: 'Unauthorized', error: 'Invalid or expired refresh token' },
        httpStatusCodes.UNAUTHORIZED,
      )
    }
    // Log any other unexpected errors
    c.var.logger.error('Failed to refresh access token', err)
    return c.json(
      { message: 'Internal Server Error', errors: null },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
