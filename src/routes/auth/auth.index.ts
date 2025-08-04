
import { createRouter } from '@/lib/create-app'

// Import blueprints
import { loginRoute, getMeRoute } from './auth.routes'

// Import handlers
import { LoginHandler } from '@/handlers/auth/login.handler'
import { GetMeHandler } from '@/handlers/auth/get-me.handler'

// Import middleware
import { authMiddleware } from '@/middleware/auth'

//a router for public auth routes
export const publicAuthRouter = createRouter()
publicAuthRouter.openapi(loginRoute, LoginHandler)

//a separate router for protected auth routes
export const protectedAuthRouter = createRouter()
protectedAuthRouter.use('/*', authMiddleware)
protectedAuthRouter.openapi(getMeRoute, GetMeHandler)