import { createRoute, z } from '@hono/zod-openapi'
import { laboratoryInsertSchema, laboratorySelectSchema, patchLaboratorySchema } from '@/db/schema'
import { pagination, paginationQuery } from '@/lib/zod-schemas'
import { errorSchema } from '@/lib/zod-schemas/error.schema'
import IdParamsSchema from '@/middleware/utils/id-params-validator'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Create laboratory route
 */
export const createLaboratoryRoute = createRoute({
  tags: ['Laboratories'],
  method: 'post',
  path: '/laboratories',
  request: {
    body: jsonContentRequired(
      laboratoryInsertSchema,
      'The laboratory to create',
    ),
  },
  responses: {
    [httpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        data: laboratorySelectSchema,
      }),
      'Laboratory successfully created',
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
 * Get laboratory by ID route
 */
export const getLaboratoryRoute = createRoute({
  tags: ['Laboratories'],
  method: 'get',
  path: '/laboratories/{id}',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: laboratorySelectSchema,
      }),
      'Laboratory successfully retrieved',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Laboratory not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Update laboratory route
 */
export const updateLaboratoryRoute = createRoute({
  tags: ['Laboratories'],
  method: 'patch',
  path: '/laboratories/{id}',
  request: {
    params: IdParamsSchema,
    body: jsonContent(
      patchLaboratorySchema,
      'The laboratory data to update',
    ),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: laboratorySelectSchema,
      }),
      'Laboratory successfully updated',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Laboratory not found',
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
 * Delete laboratory route
 */
export const deleteLaboratoryRoute = createRoute({
  tags: ['Laboratories'],
  method: 'delete',
  path: '/laboratories/{id}',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Laboratory successfully deleted',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Laboratory not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * List laboratories route with pagination
 */
export const listLaboratoriesRoute = createRoute({
  tags: ['Laboratories'],
  method: 'get',
  path: '/laboratories',
  request: {
    query: paginationQuery,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(laboratorySelectSchema),
        pagination,
      }),
      'Laboratories successfully retrieved',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Get all laboratories route
 */
export const getAllLaboratoriesRoute = createRoute({
  tags: ['Laboratories'],
  method: 'get',
  path: '/laboratories/all',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(laboratorySelectSchema),
      }),
      'All laboratories successfully retrieved',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

export type CreateLaboratoryRoute = typeof createLaboratoryRoute

export type GetLaboratoryRoute = typeof getLaboratoryRoute

export type UpdateLaboratoryRoute = typeof updateLaboratoryRoute

export type DeleteLaboratoryRoute = typeof deleteLaboratoryRoute

export type ListLaboratoriesRoute = typeof listLaboratoriesRoute

export type GetAllLaboratoriesRoute = typeof getAllLaboratoriesRoute
