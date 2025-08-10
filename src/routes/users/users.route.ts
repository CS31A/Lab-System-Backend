/**
 * @fileoverview User route definitions with OpenAPI specifications
 */

import { createRoute, z } from '@hono/zod-openapi'
import { adminSelectSchema, patchUserSchema, teacherSelectSchema, technicalStaffSelectSchema, userInsertSchema, userSelectSchema } from '@/db/schema'
import { pagination, paginationQuery } from '@/lib/zod-schemas'
import IdParamsSchema from '@/middleware/utils/id-params-validator'
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
        // data: userInsertSchema.omit({ password: true, confirmPassword: true }),
        data: userSelectSchema.omit({ password: true }),
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

export const getUserRoute = createRoute({
  tags: ['Users'],
  method: 'get',
  path: '/users/{id}',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: userSelectSchema.omit({ password: true }).extend({
          teacher: teacherSelectSchema.nullable().optional(),
          technical_staff: technicalStaffSelectSchema.nullable().optional(),
          admin: adminSelectSchema.nullable().optional(),
        }),
      }),
      'User successfully retrieved',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'User not found',
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

export const updateUserRoute = createRoute({
  tags: ['Users'],
  method: 'patch',
  path: '/users/{id}',
  request: {
    params: IdParamsSchema,
    body: jsonContent(
      patchUserSchema,
      'The user data to update',
    ),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: userSelectSchema.omit({ password: true }),
      }),
      'User successfully updated',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'User not found',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Bad Request',
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

export const softDeleteUserRoute = createRoute({
  tags: ['Users'],
  method: 'patch',
  path: '/users/{id}/delete',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: userSelectSchema.omit({ password: true }),
      }),
      'User soft-deleted successfully',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      'User not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string(), errors: z.any() }),
      'Internal Server Error',
    ),
  },
})

export const restoreUserRoute = createRoute({
  tags: ['Users'],
  method: 'patch',
  path: '/users/{id}/restore',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: userSelectSchema.omit({ password: true }),
      }),
      'User restored successfully',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({ message: z.string() }),
      'User not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({ message: z.string(), errors: z.any() }),
      'Internal Server Error',
    ),
  },
})

export const listUsersRoute = createRoute({
  tags: ['Users'],
  method: 'get',
  path: '/users',
  request: {
    query: paginationQuery,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(userSelectSchema.omit({ password: true })),
        pagination,
      }),
      'Users successfully retrieved',
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

export const getAllUsersRoute = createRoute({
  tags: ['Users'],
  method: 'get',
  path: '/users/all',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(userSelectSchema.omit({ password: true })),
      }),
      'All users successfully retrieved',
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

export type UpdateUserRoute = typeof updateUserRoute

export type GetUserRoute = typeof getUserRoute

export type ListUsersRoute = typeof listUsersRoute

export type GetAllUsersRoute = typeof getAllUsersRoute

export type SoftDeleteUserRoute = typeof softDeleteUserRoute

export type RestoreUserRoute = typeof restoreUserRoute
