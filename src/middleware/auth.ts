import type { AppBindings } from '@/lib/types/app-types'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import * as httpStatusCodes from '@/openapi/http-status-codes'

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
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
    const payload = await verify(token, c.env.JWT_SECRET)
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
