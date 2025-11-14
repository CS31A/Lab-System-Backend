/**
 * @fileoverview Type definitions for the Lab System application
 * Defines core types and interfaces used throughout the application
 */

import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi'
import type { PinoLogger } from 'hono-pino'
import type { Environment } from '@/middleware/env'

/**
 * Interface for application bindings
 *
 * @description Defines the structure for application bindings including environment variables and request variables
 *
 * @property {Environment} Bindings - Environment variables and configuration
 * @property {object} Variables - Request-scoped variables
 * @property {PinoLogger} Variables.logger - Logger instance available in request context
 */
export interface AppBindings {
  Bindings: Environment
  Variables: {
    logger: PinoLogger
  }
}

/**
 * Type alias for the application's OpenAPI Hono instance
 *
 * @description Represents the Hono application with type-safe OpenAPI bindings
 */
export type AppOpenAPI = OpenAPIHono<AppBindings>

/**
 * Type alias for application route handlers
 *
 * @description Represents a route handler with type-safe parameters and bindings
 *
 * @template R - The route configuration type
 * @param {R} R - Route configuration that includes path, method, and input/output schemas
 * @returns {RouteHandler} A function that handles the route with proper typing
 */
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>
