import { createRoute, z } from '@hono/zod-openapi'
import { technicalStaffSelectSchema } from '@/db/schema'
import {
  pagination,
  paginationQuery,
} from '@/lib/zod-schemas'
import { errorSchema } from '@/lib/zod-schemas/error.schema'

import jsonContent from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Route definition for getting a list of technical staff with pagination
 * @description Retrieves a paginated list of technical staff members
 */
export const getTechnicalStaffRoute = createRoute({
  tags: ['Technical Staff'],
  method: 'get',
  path: '/technical-staff',
  request: {
    query: paginationQuery,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(technicalStaffSelectSchema),
        pagination,
      }),
      'List of technical staff retrieved successfully',
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
 * Route definition for getting laboratories managed by technical staff
 * @description Retrieves laboratories with their current status and maintenance information
 */
export const getTechnicalStaffLaboratoriesRoute = createRoute({
  tags: ['Technical Staff'],
  method: 'get',
  path: '/technical-staff/laboratories',
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
            total_computers: z.number(),
            functional_computers: z.number(),
            maintenance_needed: z.number(),
            created_at: z.string(),
            updated_at: z.string(),
          }),
        ),
      }),
      'Laboratories with maintenance status retrieved successfully',
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
 * Route definition for getting technical staff dashboard data
 * @description Retrieves dashboard information for technical staff including maintenance tasks
 */
export const getTechnicalStaffDashboardRoute = createRoute({
  tags: ['Technical Staff'],
  method: 'get',
  path: '/technical-staff/dashboard',
  request: {
    query: z.object({
      technicalStaffId: z.string().min(1, 'Technical staff ID is required'),
    }),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.object({
          totalLaboratories: z.number(),
          totalComputers: z.number(),
          functionalComputers: z.number(),
          computersNeedingMaintenance: z.number(),
          laboratoriesUnderMaintenance: z.number(),
          recentActivities: z.array(
            z.object({
              id: z.string(),
              laboratory_name: z.string(),
              activity_type: z.string(),
              description: z.string(),
              timestamp: z.string(),
            }),
          ),
          maintenanceTasks: z.array(
            z.object({
              laboratory_id: z.string(),
              laboratory_name: z.string(),
              issue_count: z.number(),
              priority: z.enum(['low', 'medium', 'high']),
            }),
          ),
        }),
      }),
      'Technical staff dashboard data retrieved successfully',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      'Invalid query parameters',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      errorSchema,
      'Technical staff not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * @typedef {typeof getTechnicalStaffRoute} GetTechnicalStaff
 * @description Type definition for the get technical staff route
 */

/**
 * @typedef {typeof getTechnicalStaffLaboratoriesRoute} GetTechnicalStaffLaboratories
 * @description Type definition for the get technical staff laboratories route
 */

/**
 * @typedef {typeof getTechnicalStaffDashboardRoute} GetTechnicalStaffDashboard
 * @description Type definition for the get technical staff dashboard route
 */
