

import { createRoute, z } from '@hono/zod-openapi'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { access } from 'fs'
import { ref } from 'process'

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
      z.object({ id: z.string(), username: z.string(), role: z.string() }),
      'Login successful, user data returned and tokens set as httpOnly cookies',
    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string() }),
      'Invalid Credentials',
    ),
  },
})

const MeResponseSchema = z.object({
  sub: z.string().openapi({
    description: 'The user\'s unique ID',
    example: 'user_asdasd2d',

  }),
  role: z.string().openapi({
    description: 'The user\'s role.',
    example: 'admin',
  }),

})

export const getMeRoute = createRoute({
  tags: ['Auth'],
  method: 'get',
  path: '/me',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      MeResponseSchema,
      'Successfully retrieved user information from toke',

    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        message: z.string()
      }),
      'Unauthorized. Invalid or missing token'
    )
  }
})

export const logoutRoute = createRoute({
  tags: ['Auth'],
  method: 'post',
  path: '/logout',
  request: {
    headers: z.object({
      authorization: z.string().openapi({
        description: 'Bearer token for authentication.',
        example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }),
    }),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string().openapi({
          description: 'Logout successful message',
          example: 'Logout successful',
        })
      }),
      'Logout successful, user logged out',
    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        message: z.string().openapi({
          description: 'Unauthorized. Invalid or missing token',
          example: 'Unauthorized. Invalid or missing token',
        }),
      }),
      'Unauthorized. Invalid or missing token',
    )
  }
})

export const refreshRoute = createRoute({
  tags: ['Auth'],
  method: 'post',
  path: '/refresh',
  description: 'Refreshes the access token using the refresh token',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        status: z.string().openapi({ example: 'ok' }),
      }),
      'Access token refreshed successfully. New token set in httpOnly cookie.',
    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        message: z.string().openapi({ example: 'Invalid or expired refresh token.' }),
      }),
      'Unauthorized. The refresh token is missing, invalid, or expired.',
    ),
  },
})