/**
 * @fileoverview Student route definitions with OpenAPI specifications
 */

import { createRoute, z } from '@hono/zod-openapi'
import { studentSelectSchema, studentInsertSchema } from '@/db/schema'
import { pagination, paginationQuery } from '@/lib/zod-schemas'
import { errorSchema } from '@/lib/zod-schemas/error.schema'
import IdParamsSchema from '@/middleware/utils/id-params-validator'
import jsonContent from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Route definition for creating a student
 * @description Creates a new student record
 */
export const createStudentRoute = createRoute({
  tags: ['Students'],
  method: 'post',
 path: '/students',
  request: {
    body: {
      content: {
        'application/json': {
          schema: studentInsertSchema,
        },
      },
    },
  },
  responses: {
    [httpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        data: studentSelectSchema,
      }),
      'Student successfully created',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting all students
 * @description Retrieves all students without pagination
 */
export const getAllStudentsRoute = createRoute({
  tags: ['Students'],
  method: 'get',
  path: '/students',
  request: {
    query: paginationQuery,
 },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(studentSelectSchema),
        pagination,
      }),
      'Students successfully retrieved',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting all students (no pagination)
 * @description Retrieves all students without pagination
 */
export const getAllStudentsNoPaginationRoute = createRoute({
  tags: ['Students'],
  method: 'get',
  path: '/students/all',
 responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(studentSelectSchema),
      }),
      'All students successfully retrieved',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting a student by ID
 * @description Retrieves a specific student by its ID
 */
export const getStudentRoute = createRoute({
 tags: ['Students'],
  method: 'get',
  path: '/students/{id}',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: studentSelectSchema,
      }),
      'Student successfully retrieved',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Student not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

export type CreateStudentRoute = typeof createStudentRoute
export type GetAllStudentsRoute = typeof getAllStudentsRoute
export type GetAllStudentsNoPaginationRoute = typeof getAllStudentsNoPaginationRoute
export type GetStudentRoute = typeof getStudentRoute