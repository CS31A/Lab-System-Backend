/**
 * @fileoverview Auth routes registration
 */

import { createRouter } from '@/lib/create-app'
import { loginRoute } from './auth.routes'
import { LoginHandler } from '@/handlers/auth/login.handler'

const router = createRouter()
  .openapi(loginRoute, LoginHandler)

export default router 