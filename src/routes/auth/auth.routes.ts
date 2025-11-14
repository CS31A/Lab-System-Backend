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

/**
 * Route definition for user login
 * @description Handles user authentication and returns access/refresh tokens
 */
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

/**
 * Route definition for getting current user information
 * @description Retrieves user information based on the authentication token
 */
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

/**
 * Route definition for user logout
 * @description Handles user logout by clearing the refresh token
 */
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

/**
 * Route definition for refreshing access token
 * @description Refreshes the access token using the refresh token
 */
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

/**
 * @typedef {typeof loginRoute} LoginRoute
 * @description Type definition for the login route
 */

/**
 * @typedef {typeof getCurrentUserRoute} GetCurrentUserRoute
 * @description Type definition for the get current user route
 */

/**
 * @typedef {typeof logoutRoute} LogoutRoute
 * @description Type definition for the logout route
 */

/**
 * @typedef {typeof refreshRoute} RefreshRoute
 * @description Type definition for the refresh route
 */
// Password Reset Routes
export const forgotPasswordRoute = createRoute({
  tags: ['Auth'],
  method: 'post',
  path: '/forgot-password',
  description: 'Request a password reset email',
  request: {
    body: jsonContentRequired(
      z.object({
        email: z.string().email('Invalid email format'),
      }),
      'Email address for password reset',
    ),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      'Password reset email sent (if account exists)',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorResponseSchema,
      'Invalid request body',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorResponseSchema,
      'Internal Server Error',
    ),
  },
})

export const resetPasswordRoute = createRoute({
  tags: ['Auth'],
  method: 'post',
  path: '/reset-password',
  description: 'Reset password using a valid reset token',
  request: {
    body: jsonContentRequired(
      z.object({
        token: z.string().min(1, 'Reset token is required'),
        newPassword: z
          .string()
          .min(8, 'Password must be at least 8 characters')
          .regex(
            /^(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter and one number'
          ),
      }),
      'Reset token and new password',
    ),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      'Password reset successful',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      'Invalid or expired token',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
      'Internal Server Error',
    ),
  },
})

export const validateResetTokenRoute = createRoute({
  tags: ['Auth'],
  method: 'get',
  path: '/validate-reset-token',
  description: 'Validate a password reset token without consuming it',
  request: {
    query: z.object({
      token: z.string().min(1, 'Reset token is required'),
    }),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        valid: z.boolean(),
        message: z.string(),
        user: z.object({
          username: z.string(),
          email: z.string(),
        }).optional(),
        expiresAt: z.string().datetime().optional(),
      }),
      'Token validation result',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        valid: z.boolean(),
        message: z.string(),
      }),
      'Invalid token or missing token parameter',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        valid: z.boolean(),
        message: z.string(),
      }),
      'Internal Server Error',
    ),
  },
})
export type LoginRoute = typeof loginRoute
export type GetCurrentUserRoute = typeof getCurrentUserRoute
export type LogoutRoute = typeof logoutRoute
export type RefreshRoute = typeof refreshRoute
export type ForgotPasswordRoute = typeof forgotPasswordRoute
export type ResetPasswordRoute = typeof resetPasswordRoute
export type ValidateResetTokenRoute = typeof validateResetTokenRoute
