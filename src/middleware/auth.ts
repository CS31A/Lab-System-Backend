
import { createMiddleware } from 'hono/factory'
import { verify } from 'hono/jwt'
import type { AppBindings } from '@/lib/types/app-types'
import { HTTPException } from 'hono/http-exception'

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  //Authorization header
  const authHeader = c.req.header('Authorization')

  // Check if the header exists and is in the correct "Bearer" format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Unauthorized: Missing or invalid token' })
  }

  //Extract token string
  const token = authHeader.substring(7) // "Bearer ".length is 7

  try {
    // Verify the token using your secret.
    const payload = await verify(token, c.env.JWT_SECRET)

    //Set the verified payload on the context for the next handler.
    c.set('jwtPayload', payload)

  } catch (error) {
    throw new HTTPException(401, { message: 'Unauthorized: Invalid token' })
  }
  await next()
})