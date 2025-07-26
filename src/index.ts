/**
 * @fileoverview Main application entry point for Lab System Backend API.
 * Sets up Hono app with OpenAPI docs, middleware, and route configuration.
 */

import type { AppOpenAPI } from './lib/types/app-types'
import createApp from '@/lib/create-app'
import configureOpenAPI from '@/lib/openapi-configuration'

// Imports the index routes of each route group in the routes directory
import index from '@/routes/index'
import users from '@/routes/users/users.index'

// Create main app with middleware, logging, and error handling
const app = createApp()

// Array of all index routes to register
const routes = [index, users]

// Setup OpenAPI documentation at /docs and /reference
configureOpenAPI(app as AppOpenAPI)

// Register all index routes at root path
routes.forEach(route =>
  app.route('/', route),
)

export default app
