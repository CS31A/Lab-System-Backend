
import { createRouter } from '@/lib/create-app'

// Import blueprints
import { loginRoute, getMeRoute, logoutRoute, refreshRoute } from './auth.routes'

// Import handlers
import { LoginHandler } from '@/handlers/auth/login.handler'
import { GetMeHandler } from '@/handlers/auth/get-me.handler'
import { LogoutHandler } from '@/handlers/auth/logout.handlers'
import { RefreshHandler } from '@/handlers/auth/refresh.handler'

// Import middleware
import { authMiddleware } from '@/middleware/auth'

//a router for public auth routes
export const publicAuthRouter = createRouter()
publicAuthRouter.openapi(loginRoute, LoginHandler)
publicAuthRouter.openapi(refreshRoute, RefreshHandler)

//a separate router for protected auth routes
export const protectedAuthRouter = createRouter()
protectedAuthRouter.use('/*', authMiddleware)
protectedAuthRouter.openapi(getMeRoute, GetMeHandler)
protectedAuthRouter.openapi(logoutRoute, LogoutHandler)