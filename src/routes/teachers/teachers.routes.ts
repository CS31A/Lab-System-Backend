import { createRoute, z } from '@hono/zod-openapi'
import { teacherSelectSchema } from '@/db/schema'
import {
  pagination,
  paginationQuery,
  teacherDashboardQuerySchema,
  teacherDashboardResponseSchema,
} from '@/lib/zod-schemas'
import { errorSchema } from '@/lib/zod-schemas/error.schema'

import jsonContent from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Route definition for getting teacher dashboard data
 * @description Retrieves dashboard information for a teacher based on query parameters
 */
export const getTeacherDashboardRoute = createRoute({
  tags: ['Teachers'],
  method: 'get',
  path: '/teachers/dashboard',
  request: {
    query: teacherDashboardQuerySchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      teacherDashboardResponseSchema,
      'Teacher dashboard data retrieved successfully',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      'Invalid query parameters',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting a list of teachers with pagination
 * @description Retrieves a paginated list of teachers
 */
export const getTeachersRoute = createRoute({
  tags: ['Teachers'],
  method: 'get',
  path: '/teachers',
  request: {
    query: paginationQuery,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(teacherSelectSchema),
        pagination,
      }),
      'List of teachers retrieved successfully',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      'Invalid query parameters',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting laboratories assigned to a teacher
 * @description Retrieves laboratories with their current status for a teacher
 */
export const getTeacherLaboratoriesRoute = createRoute({
  tags: ['Teachers'],
  method: 'get',
  path: '/teachers/laboratories',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            status: z.boolean(),
            vacancy_status: z.enum(['available', 'occupied', 'maintenance']),
            current_schedule: z.object({
              id: z.string(),
              section: z.string(),
              start_time: z.string(),
              end_time: z.string(),
              subject_name: z.string(),
              teacher_name: z.string(),
            }).nullable(),
            created_at: z.string(),
            updated_at: z.string(),
          }),
        ),
      }),
      'Laboratories with current status retrieved successfully',
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

/**
 * @typedef {typeof getTeachersRoute} GetTeachers
 * @description Type definition for the get teachers route
 */

/**
 * @typedef {typeof getTeacherDashboardRoute} GetTeacherDashboard
 * @description Type definition for the get teacher dashboard route
 */

/**
 * @typedef {typeof getTeacherLaboratoriesRoute} GetTeacherLaboratories
 * @description Type definition for the get teacher laboratories route
 */
