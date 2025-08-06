
import { createRouter } from '@/lib/create-app'

// Import blueprints
import { loginRoute, getMeRoute, logoutRoute } from './auth.routes'

// Import handlers
import { LoginHandler } from '@/handlers/auth/login.handler'
import { GetMeHandler } from '@/handlers/auth/get-me.handler'
import { LogoutHandler } from '@/handlers/auth/logout.handlers'

// Import middleware
import { authMiddleware } from '@/middleware/auth'

//a router for public auth routes
export const publicAuthRouter = createRouter()
publicAuthRouter.openapi(loginRoute, LoginHandler)

//a separate router for protected auth routes
export const protectedAuthRouter = createRouter()
protectedAuthRouter.use('/*', authMiddleware)
protectedAuthRouter.openapi(getMeRoute, GetMeHandler)
protectedAuthRouter.openapi(logoutRoute, LogoutHandler)