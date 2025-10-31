/**
 * @fileoverview Schedule route definitions with OpenAPI specifications
 */

import { createRoute, z } from '@hono/zod-openapi'
import { patchScheduleSchema, scheduleInsertSchema, scheduleSelectSchema } from '@/db/schema'
import { pagination, paginationQuery } from '@/lib/zod-schemas'
import { errorSchema } from '@/lib/zod-schemas/error.schema'
import IdParamsSchema from '@/middleware/utils/id-params-validator'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Route definition for creating a new schedule
 * @description Handles the creation of a new schedule
 */
export const createScheduleRoute = createRoute({
  tags: ['Schedules'],
  method: 'post',
  path: '/schedules',
  request: {
    body: jsonContentRequired(
      scheduleInsertSchema,
      'The schedule to create',
    ),
  },
  responses: {
    [httpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        data: scheduleSelectSchema,
      }),
      'Schedule successfully created',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      'Validation failed',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting a schedule by ID
 * @description Retrieves a specific schedule by its ID
 */
export const getScheduleRoute = createRoute({
  tags: ['Schedules'],
  method: 'get',
  path: '/schedules/{id}',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: scheduleSelectSchema,
      }),
      'Schedule successfully retrieved',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Schedule not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for updating a schedule
 * @description Updates an existing schedule by its ID
 */
export const updateScheduleRoute = createRoute({
  tags: ['Schedules'],
  method: 'patch',
  path: '/schedules/{id}',
  request: {
    params: IdParamsSchema,
    body: jsonContent(
      patchScheduleSchema,
      'The schedule data to update',
    ),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: scheduleSelectSchema,
      }),
      'Schedule successfully updated',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Schedule not found',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      'Bad Request',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for deleting a schedule
 * @description Deletes an existing schedule by its ID
 */
export const deleteScheduleRoute = createRoute({
  tags: ['Schedules'],
  method: 'delete',
  path: '/schedules/{id}',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Schedule successfully deleted',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Schedule not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for listing schedules with pagination
 * @description Retrieves a paginated list of schedules
 */
export const listSchedulesRoute = createRoute({
  tags: ['Schedules'],
  method: 'get',
  path: '/schedules',
  request: {
    query: paginationQuery,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(scheduleSelectSchema),
        pagination,
      }),
      'Schedules successfully retrieved',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting all schedules without pagination
 * @description Retrieves all schedules without pagination
 */
export const getAllSchedulesRoute = createRoute({
  tags: ['Schedules'],
  method: 'get',
  path: '/schedules/all',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(scheduleSelectSchema),
      }),
      'All schedules successfully retrieved',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * @typedef {typeof createScheduleRoute} CreateScheduleRoute
 * @description Type definition for the create schedule route
 */

/**
 * @typedef {typeof getScheduleRoute} GetScheduleRoute
 * @description Type definition for the get schedule route
 */

/**
 * @typedef {typeof updateScheduleRoute} UpdateScheduleRoute
 * @description Type definition for the update schedule route
 */

/**
 * @typedef {typeof deleteScheduleRoute} DeleteScheduleRoute
 * @description Type definition for the delete schedule route
 */

/**
 * @typedef {typeof listSchedulesRoute} ListSchedulesRoute
 * @description Type definition for the list schedules route
 */

/**
 * @typedef {typeof getAllSchedulesRoute} GetAllSchedulesRoute
 * @description Type definition for the get all schedules route
 */
