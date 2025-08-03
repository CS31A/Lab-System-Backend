import type { Context } from 'hono'
import { loginRoute } from '@/routes/auth/auth.routes'
import { AuthService } from '@/services/AuthService'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { AppBindings } from '@/lib/types/app-types'

const loginSchema = loginRoute.request.body.content['application/json']['schema']

export const LoginHandler = async (c: Context<AppBindings>) => {
  const body = await c.req.json()
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ message: 'Invalid request body' }, httpStatusCodes.BAD_REQUEST)
  }

  const { username, password } = parsed.data

  try {
    const authService = new AuthService(c)
    const token = await authService.login(username, password)
    return c.json({ token }, httpStatusCodes.OK)
    
  } catch (error) {
    return c.json({ message: 'Invalid Credentials' }, httpStatusCodes.UNAUTHORIZED)
  }
}
