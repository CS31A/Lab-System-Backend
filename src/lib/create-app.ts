/**
 * @fileoverview Application creation module for Lab System Backend API.
 * Creates and configures the main Hono application with middleware and error handling.
 */
import type { AppBindings, AppOpenAPI } from '@/lib/types/app-types'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import logger from '@/middleware/pino-logger'
import notFound from '@/middleware/utils/not-found'
import onError from '@/middleware/utils/on-error'
// import serveEmojiFavicon from '@/middleware/utils/serve-emoji-favicon'
import defaultHook from '@/openapi/default-hook'

/**
 * Creates the main Hono application with middleware, logging, and error handling.
 *
 * This function initializes the main application instance with essential middleware
 * including CORS configuration, pino logging, and error handling. It sets up the
 * basic infrastructure needed for the API server to function properly.
 *
 * The application includes:
 * - Pino logger middleware for structured logging
 * - CORS middleware configured for local development
 * - Not found handler for 404 responses
 * - Error handler for internal server errors
 *
 * @returns {OpenAPIHono<AppBindings>} The configured Hono application instance
 *
 * @example
 * ```typescript
 * import createApp from '@/lib/create-app'
 *
 * const app = createApp()
 * // Use the app with your routes
 * app.route('/api', apiRoutes)
 *
 * export default app
 * ```
 */
export default function createApp() {
  const app = createRouter()
    .use(logger())
    .use(
      cors({
        origin: ['http://localhost:5173'],
        credentials: true,
      }),
    )
    // .use(serveEmojiFavicon('🔥'))
  app.notFound(notFound)
  app.onError(onError)

  return app
}

/**
 * Creates a new OpenAPI Hono router instance with default configuration.
 *
 * This function initializes a new OpenAPI-compliant Hono router with default
 * settings including non-strict mode and a default hook for validation.
 * The router can be used to define API routes with OpenAPI specifications.
 *
 * @returns {OpenAPIHono<AppBindings>} A new OpenAPI Hono router instance
 *
 * @example
 * ```typescript
 * import { createRouter } from '@/lib/create-app'
 *
 * const router = createRouter()
 * router.get('/hello', (c) => c.json({ message: 'Hello World' }))
 * ```
 */
export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  })
}

/**
 * Creates a test application by wrapping the provided router.
 *
 * This function is used for testing purposes to isolate route logic.
 * It creates a new application instance that includes the same middleware
 * and configuration as the main application but allows testing of specific
 * route handlers in isolation.
 *
 * @param {AppOpenAPI} router - The router to wrap in a test application
 * @returns {OpenAPIHono<AppBindings>} A test application instance
 *
 * @example
 * ```typescript
 * import { createTestApp } from '@/lib/create-app'
 * import { userRoutes } from '@/routes/users/users.route'
 *
 * const testApp = createTestApp(userRoutes)
 * // Use testApp for testing user routes
 * ```
 */
export function createTestApp(router: AppOpenAPI) {
  const testApp = createRouter()
  testApp.route('/', router)

  return testApp
}
