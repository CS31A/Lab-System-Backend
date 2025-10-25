/**
 * @fileoverview Authentication schema definitions for API requests and responses
 * Defines the structure for authentication-related data throughout the application
 */

import { z } from '@hono/zod-openapi'

/**
 * Zod schema for login request body
 *
 * @description Defines the structure for login credentials
 *
 * @property {string} username - The username for authentication (minimum length: 1)
 * @property {string} password - The password for authentication (minimum length: 1)
 *
 * @example
 * {
 *   username: "john_doe",
 *   password: "securePassword123"
 * }
 */
export const loginBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

/**
 * Zod schema for user data in authentication context
 *
 * @description Defines the structure for user information returned in authentication contexts
 *
 * @property {string} sub - The subject identifier (typically user ID)
 * @property {string} role - The role of the authenticated user
 *
 * @example
 * {
 *   sub: "user123",
 *   role: "teacher"
 * }
 */
export const meDataSchema = z.object({
  sub: z.string(),
  role: z.string(),
})

/**
 * Zod schema for JWT payload
 *
 * @description Defines the structure for JWT token payload
 *
 * @property {string} sub - The subject identifier (typically user ID)
 * @property {string} role - The role of the authenticated user
 * @property {number} exp - The expiration timestamp of the token
 *
 * @example
 * {
 *   sub: "user123",
 *   role: "teacher",
 *   exp: 1678886400
 * }
 */
export const jwtPayloadSchema = z.object({
  sub: z.string(),
  role: z.string(),
  exp: z.number(),
})

/**
 * Zod schema for login response
 *
 * @description Defines the structure for the response returned by the login endpoint
 *
 * @property {string} message - A message providing information about the login result
 * @property {object} data - The main data object containing user information
 * @property {string} data.id - The unique identifier of the authenticated user
 * @property {string} data.username - The username of the authenticated user
 * @property {string} data.role - The role of the authenticated user
 *
 * @example
 * {
 *   message: "Login successful",
 *   data: {
 *     id: "user123",
 *     username: "john_doe",
 *     role: "teacher"
 *   }
 * }
 */
export const loginResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    username: z.string(),
    role: z.string(),
  }),
})

/**
 * Zod schema for error responses
 *
 * @description Defines the structure for error responses throughout the application
 *
 * @property {string} message - A message describing the error
 * @property {any} [errors] - Optional additional error details, can be any type of data structure
 *
 * @example
 * {
 *   message: "Validation failed",
 *   errors: {
 *     field: "username",
 *     issue: "Username is required"
 *   }
 * }
 */
export const errorResponseSchema = z.object({
  message: z.string(),
  errors: z.any().optional(),
})

/**
 * Zod schema for unauthorized responses
 *
 * @description Defines the structure for responses when a user is not authorized
 *
 * @property {string} message - A message providing information about the unauthorized access
 *
 * @example
 * {
 *   message: "Unauthorized access"
 * }
 */
export const unauthorizedResponseSchema = z.object({
  message: z.string(),
})

/**
 * Zod schema for basic message responses
 *
 * @description Defines the structure for simple message responses throughout the application
 *
 * @property {string} message - A message providing information about the response
 *
 * @example
 * {
 *   message: "Operation completed successfully"
 * }
 */
export const basicMessageResponseSchema = z.object({
  message: z.string(),
})
