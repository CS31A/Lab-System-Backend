/**
 * @fileoverview Auth router
 * Exports a router that self-prefixes its routes under "/auth" so
 * the root registrar can mount it at "/" and still get "/auth/*" paths.
 */

import { createRouter } from '@/lib/create-app'

// Import blueprints
import { loginRoute, getCurrentUserRoute, logoutRoute, refreshRoute } from './auth.routes'

// Import handlers
import { LoginHandler } from '@/handlers/auth/login.handler'
import { GetCurrentUserHandler } from '@/handlers/auth/get-current-user.handler'
import { LogoutHandler } from '@/handlers/auth/logout.handler'
import { RefreshHandler } from '@/handlers/auth/refresh.handler'

// Import middleware
import { authMiddleware } from '@/middleware/auth'

// Sub-router that contains actual endpoints
const authSubRouter = createRouter()

// public endpoints
authSubRouter.openapi(loginRoute, LoginHandler)
authSubRouter.openapi(refreshRoute, RefreshHandler)

// protected endpoints
authSubRouter.use('*', authMiddleware)
authSubRouter.openapi(getCurrentUserRoute, GetCurrentUserHandler)
authSubRouter.openapi(logoutRoute, LogoutHandler)

// Wrapper router that mounts the sub-router at /auth
const authRouter = createRouter()
authRouter.route('/auth', authSubRouter)

export default authRouter