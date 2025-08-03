

import { createRoute, z } from '@hono/zod-openapi'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

const LoginBodySchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

export const loginRoute = createRoute({
  tags: ['Auth'],
  method: 'post',
  path: '/login',
  request: {
    body: jsonContentRequired(
      LoginBodySchema,
      'The credentials for user login',
    ),
  },
  responses: {
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({ message: z.string() }),
      'Invalid request body provided',
    ),
    [httpStatusCodes.OK]: jsonContent(
      z.object({ token: z.string() }),
      'Login successful, JWT returned',
    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      'Invalid Credentials',
    ),
  },
})