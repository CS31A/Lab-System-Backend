/**
 * @fileoverview Main application entry point for Lab System Backend API.
 * Sets up Hono app with OpenAPI docs, middleware, and route configuration.
 */

import type { AppOpenAPI } from './lib/types/app-types'
import createApp from '@/lib/create-app'
import configureOpenAPI from '@/lib/openapi-configuration'

import auth from '@/routes/auth/auth.index'
// Imports the index routes of each route group in the routes directory
import index from '@/routes/index'

import laboratories from '@/routes/laboratories/laboratories.index'
import subjects from '@/routes/subjects/subjects.index'
import teachers from '@/routes/teachers/teachers.index'
import users from '@/routes/users/users.index'

// Create main app with middleware, logging, and error handling
const app = createApp()

// Array of all index routes to register
const routes = [index, users, teachers, subjects, laboratories, auth]

// Register all index routes at root path
routes.forEach(route =>
  app.route('/', route),
)

// Setup OpenAPI documentation at /docs and /reference (after routes are registered)
configureOpenAPI(app as AppOpenAPI)
export default app
