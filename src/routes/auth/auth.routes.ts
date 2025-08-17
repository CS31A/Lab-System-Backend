/**
 * @fileoverview Auth route definitions (login, refresh, logout, me)
 */

import { createRoute, z } from '@hono/zod-openapi'
import {
  basicMessageResponseSchema,
  errorResponseSchema,
  loginBodySchema,
  loginResponseSchema,
  meDataSchema,
  unauthorizedResponseSchema,
} from '@/lib/zod-schemas'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

export const loginRoute = createRoute({
  tags: ['Auth'],
  method: 'post',
  path: '/login',
  request: {
    body: jsonContentRequired(
      loginBodySchema,
      'The credentials for user login',
    ),
  },
  responses: {
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      basicMessageResponseSchema,
      'Invalid request body provided',
    ),
    [httpStatusCodes.OK]: jsonContent(
      loginResponseSchema,
      'Login successful',
    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedResponseSchema,
      'Invalid Credentials',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema,
      'Internal Server Error',
    ),
  },
})

export const getCurrentUserRoute = createRoute({
  tags: ['Auth'],
  method: 'get',
  path: '/me',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: meDataSchema,
      }),
      'Successfully retrieved user information from token',
    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedResponseSchema,
      'Unauthorized. Invalid or missing token',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema,
      'Internal Server Error',
    ),
  },
})

export const logoutRoute = createRoute({
  tags: ['Auth'],
  method: 'post',
  path: '/logout',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      basicMessageResponseSchema,
      'Logout successful',
    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedResponseSchema,
      'Unauthorized. Invalid or missing token',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema,
      'Internal Server Error',
    ),
  },
})

export const refreshRoute = createRoute({
  tags: ['Auth'],
  method: 'post',
  path: '/refresh',
  description: 'Refreshes the access token using the refresh token',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      basicMessageResponseSchema,
      'Access token refreshed successfully. New token is set in an httpOnly cookie.',
    ),
    [httpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedResponseSchema,
      'Unauthorized. The refresh token is missing, invalid, or expired.',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema,
      'Internal Server Error',
    ),
  },
})

export type LoginRoute = typeof loginRoute
export type GetCurrentUserRoute = typeof getCurrentUserRoute
export type LogoutRoute = typeof logoutRoute
export type RefreshRoute = typeof refreshRoute
