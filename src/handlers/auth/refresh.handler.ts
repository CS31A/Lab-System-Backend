/**
 * @fileoverview Refresh handler - issues a new short-lived access token using a valid refresh token cookie
 */

import { getCookie, setCookie } from 'hono/cookie'
import { AuthService } from '@/services/AuthService'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { HTTPException } from 'hono/http-exception'
import type { AppRouteHandler } from '@/lib/types/app-types'

export const RefreshHandler: AppRouteHandler<typeof import('@/routes/auth/auth.routes').refreshRoute> = async (c) => {
  const refreshToken = getCookie(c, 'refreshToken')

  if (!refreshToken) {
    throw new HTTPException(401, { message: 'Refresh token not found.' })
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
  catch (error: any) {
    const errMsg = (error as Error).message
    if (errMsg.toLowerCase().includes('invalid') || errMsg.toLowerCase().includes('expired')) {
      throw new HTTPException(401, { message: 'Invalid or expired refresh token.' })
    }
    return c.json({ message: 'Internal Server Error', errors: errMsg }, httpStatusCodes.INTERNAL_SERVER_ERROR)
  }
}