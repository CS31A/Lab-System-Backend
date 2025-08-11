/**
 * @fileoverview Auth route definitions (login, refresh, logout, me)
 * Aligned with project-wide conventions for response shape and documentation.
 */

import { createRoute, z } from '@hono/zod-openapi'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { get } from 'http'

const LoginBodySchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }).openapi({
    example: 'testuser',
    description: 'The account username',
  }),
  password: z.string().min(1, { message: 'Password is required' }).openapi({
    example: 'password123',
    description: 'The account password',
  }),
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
      z.object({
        message: z.string().openapi({ example: 'Login successful' }),
        data: z.object({ id: z.string(), username: z.string(), role: z.string() }),
      }),
      'Login successful. Tokens are set as httpOnly cookies.',
    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({ message: z.string().openapi({ example: 'Invalid credentials' }) }),
      'Invalid Credentials',
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

const MeDataSchema = z.object({
  sub: z.string().openapi({
    description: 'The user\'s unique ID',
    example: 'user_asdasd2d',
  }),
  role: z.string().openapi({
    description: 'The user\'s role.',
    example: 'admin',
  }),
})

export const getCurrentUserRoute = createRoute({
  tags: ['Auth'],
  method: 'get',
  path: '/me',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string().openapi({ example: 'User info retrieved' }),
        data: MeDataSchema,
      }),
      'Successfully retrieved user information from token',

    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        message: z.string()
      }),
      'Unauthorized. Invalid or missing token'
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Internal Server Error',
    ),
  }
})

export const logoutRoute = createRoute({
  tags: ['Auth'],
  method: 'post',
  path: '/logout',
  // Auth is enforced by router middleware; no explicit header required here
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string().openapi({
          description: 'Logout successful message',
          example: 'Logged out successfully',
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
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Internal Server Error',
    ),
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
        message: z.string().openapi({ example: 'Access token refreshed' }),
      }),
      'Access token refreshed successfully. New token is set in an httpOnly cookie.',
    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      z.object({
        message: z.string().openapi({ example: 'Invalid or expired refresh token.' }),
      }),
      'Unauthorized. The refresh token is missing, invalid, or expired.',
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


export type GetCurrentUserRoute = typeof getCurrentUserRoute

export type LoginRoute = typeof loginRoute

export type LogoutRoute = typeof logoutRoute

export type RefreshRoute = typeof refreshRoute