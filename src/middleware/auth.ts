
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import type { AppBindings } from '@/lib/types/app-types'
import { HTTPException } from 'hono/http-exception'
import { getCookie } from 'hono/cookie'

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const token = getCookie(c, 'accessToken')

  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized: Missing access token' })
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET)
    c.set('jwtPayload', payload)
  } catch (error) {
    throw new HTTPException(401, { message: 'Unauthorized: Invalid access token' })
  }

  await next()
})