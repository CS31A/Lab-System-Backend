
import type { Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import type { AppBindings } from '@/lib/types/app-types'
import { AuthService } from '@/services/AuthService'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { HTTPException } from 'hono/http-exception'

export const RefreshHandler = async (c: Context<AppBindings>) => {
  const refreshToken = getCookie(c, 'refreshToken')

  if (!refreshToken) {
    throw new HTTPException(401, { message: 'Refresh token not found.' })
  }

  try {
    const authService = new AuthService(c)
    const newAccessToken = await authService.refresh(refreshToken)

    // 4. Set the new access token in its httpOnly cookie.
    setCookie(c, 'accessToken', newAccessToken, {
      httpOnly: true,
      secure: true, //user_id: varchar('user_id', { length: 12 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
      sameSite: 'Strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    return c.json({ status: 'ok' }, httpStatusCodes.OK)

  } catch (error: any) {
    throw new HTTPException(401, { message: 'Invalid or expired refresh token.' })
  }
}