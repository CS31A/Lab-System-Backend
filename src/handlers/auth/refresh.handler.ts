
import type { Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import type { AppBindings } from '@/lib/types/app-types'
import { AuthService } from '@/services/AuthService'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { HTTPException } from 'hono/http-exception'

export const RefreshHandler = async (c: Context<AppBindings>) => {
  // 1. Get the refresh token from its dedicated httpOnly cookie.
  const refreshToken = getCookie(c, 'refreshToken')

  // 2. If the cookie is missing, we can't proceed.
  if (!refreshToken) {
    throw new HTTPException(401, { message: 'Refresh token not found.' })
  }

  try {
    const authService = new AuthService(c)
    // 3. Call the new service method.
    const newAccessToken = await authService.refresh(refreshToken)

    // 4. Set the new access token in its httpOnly cookie.
    setCookie(c, 'accessToken', newAccessToken, {
      httpOnly: true,
      secure: c.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    // 5. Return a simple success status.
    return c.json({ status: 'ok' }, httpStatusCodes.OK)

  } catch (error: any) {
    // If the service throws an error (token invalid, expired, etc.)
    throw new HTTPException(401, { message: error.message || 'Invalid or expired refresh token.' })
  }
}