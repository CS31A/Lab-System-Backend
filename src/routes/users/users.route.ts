/**
 * @fileoverview User route definitions with OpenAPI specifications
 */

import { createRoute, z } from '@hono/zod-openapi'
import { userInsertSchema } from '@/db/schema'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * User creation route with role-based access (teacher/technical_staff/admin).
 * Validates email/username uniqueness and password strength requirements.
 */
export const createUserRoute = createRoute({
  tags: ['Users'],
  method: 'post',
  path: '/users',
  request: {
    body: jsonContentRequired(
      userInsertSchema,
      'The user to create',
    ),
  },
  responses: {
    [httpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        data: userInsertSchema.omit({ password: true, confirmPassword: true }),
      }),
      'User successfully created',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Validation failed',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Internal Server Error',
    ),
  },
})

export type CreateUserRoute = typeof createUserRoute
