/**
 * @fileoverview Refresh handler - issues a new short-lived access token using a valid refresh token cookie
 */

import { getCookie, setCookie } from 'hono/cookie'
import { AuthService } from '@/services/AuthService'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { HTTPException } from 'hono/http-exception'
import type { AppRouteHandler } from '@/lib/types/app-types'
import type { RefreshRoute } from '@/routes/auth/auth.routes'

export const RefreshHandler: AppRouteHandler<RefreshRoute> = async (c) => {
  const refreshToken = getCookie(c, 'refreshToken')

  if (!refreshToken) {
    return c.json(
      {
        message: 'Unauthorized',
        error: 'Refresh token is missing',
      },
      httpStatusCodes.UNAUTHORIZED
    );
  }
  try {
    const authService = new AuthService(c)
    const newAccessToken = await authService.issueNewAccessToken(refreshToken)

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
    // Typed error check for invalid/expired refresh token
    if (err instanceof Error && (err.message === 'Invalid refresh token' || err.message === 'Refresh token expired')) {
      c.var.logger.warn('Refresh token invalid or expired', err)
      return c.json(
        { message: 'Unauthorized', error: 'Invalid or expired refresh token' },
        httpStatusCodes.UNAUTHORIZED,
      )
    }
    c.var.logger.error('Failed to refresh access token', err)
    return c.json(
      { message: 'Internal Server Error', errors: null },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
