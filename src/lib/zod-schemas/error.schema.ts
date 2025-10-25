import z from 'zod'

/**
 * @fileoverview Error schema definition for API responses
 * Defines the structure for error responses throughout the application
 */

/**
 * Zod schema for error responses
 *
 * @property {string} message - The error message describing what went wrong
 * @property {any} errors - Additional error details, can be any type of data structure
 *
 * @example
 * {
 *   message: "Validation failed",
 *   errors: {
 *     field: "email",
 *     issue: "Invalid email format"
 *   }
 * }
 */
export const errorSchema = z.object({
  message: z.string(),
  errors: z.any(),
})
