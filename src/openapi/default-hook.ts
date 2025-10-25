/**
 * @fileoverview Default hook for OpenAPI validation in Lab System Backend API.
 * Handles validation errors and returns appropriate HTTP responses.
 */
import type { Hook } from '@hono/zod-openapi'

import { UNPROCESSABLE_ENTITY } from './http-status-codes'

/**
 * Default hook function for OpenAPI validation.
 * Returns a 42 Unprocessable Entity response when validation fails.
 * @param {any} result - The validation result from Zod schema validation
 * @param {any} c - The Hono context
 * @returns {void|Response} Returns error response if validation fails, otherwise undefined
 */
const defaultHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    return c.json({
      success: result.success,
      error: result.error,
    }, UNPROCESSABLE_ENTITY)
  }
}

export default defaultHook
