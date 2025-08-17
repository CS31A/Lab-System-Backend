/**
 * @fileoverview Auth router
 * Exports a router that self-prefixes its routes under "/auth" so
 * the root registrar can mount it at "/" and still get "/auth/*" paths.
 */

// Import handlers
import { GetCurrentUserHandler } from '@/handlers/auth/get-current-user.handler'
import { LoginHandler } from '@/handlers/auth/login.handler'
import { LogoutHandler } from '@/handlers/auth/logout.handler'
import { RefreshHandler } from '@/handlers/auth/refresh.handler'
import { createRouter } from '@/lib/create-app'
// Import middleware
import { authMiddleware } from '@/middleware/auth'

// Import blueprints
import * as routes from './auth.routes'

// Sub-router that contains actual endpoints
const authRouter = createRouter().basePath('/auth')

// public endpoints
authRouter.openapi(routes.loginRoute, LoginHandler)
authRouter.openapi(routes.refreshRoute, RefreshHandler)

// protected endpoints
authRouter.use('*', authMiddleware())
authRouter.openapi(routes.getCurrentUserRoute, GetCurrentUserHandler)
authRouter.openapi(routes.logoutRoute, LogoutHandler)

export default authRouter
