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
 * Route definition for getting schedules for a specific laboratory
 * @description Retrieves all schedules for a given laboratory by ID
 */
export const getLabScheduleRoute = createRoute({
  tags: ['Teachers'],
  method: 'get',
  path: '/teachers/laboratories/{labId}/schedule',
  request: {
    params: z.object({
      labId: z
        .string()
        .trim()
        .min(1, 'labId is required')
        .openapi({
          param: {
            name: 'labId',
            in: 'path',
            required: true,
          },
          example: 'lab123456789',
        }),
    }),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            section: z.string(),
            start_time: z.date(),
            end_time: z.date(),
            status: z.string().nullable(),
            created_at: z.date(),
            updated_at: z.date(),
            subject: z.object({
              id: z.string(),
              name: z.string(),
              code: z.string(),
            }),
            teacher: z.object({
              id: z.string(),
              firstname: z.string().nullable(),
              lastname: z.string().nullable(),
            }),
            laboratory: z.object({
              id: z.string(),
              name: z.string(),
            }),
          }),
        ),
      }),
      'Laboratory schedules retrieved successfully',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      'Invalid labId parameter',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Laboratory not found',
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
export type GetTeachers = typeof getTeachersRoute

/**
 * @typedef {typeof getTeacherDashboardRoute} GetTeacherDashboard
 * @description Type definition for the get teacher dashboard route
 */
export type GetTeacherDashboard = typeof getTeacherDashboardRoute

/**
 * @typedef {typeof getTeacherLaboratoriesRoute} GetTeacherLaboratories
 * @description Type definition for the get teacher laboratories route
 */
export type GetTeacherLaboratories = typeof getTeacherLaboratoriesRoute

/**
 * @typedef {typeof getLabScheduleRoute} GetLabSchedule
 * @description Type definition for the get lab schedule route
 */
export type GetLabSchedule = typeof getLabScheduleRoute
