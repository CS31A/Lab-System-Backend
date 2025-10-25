import { createRoute, z } from '@hono/zod-openapi'
import { laboratoryInsertSchema, laboratorySelectSchema, patchLaboratorySchema } from '@/db/schema'
import { pagination, paginationQuery } from '@/lib/zod-schemas'
import { errorSchema } from '@/lib/zod-schemas/error.schema'
import IdParamsSchema from '@/middleware/utils/id-params-validator'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Route definition for creating a new laboratory
 * @description Handles the creation of a new laboratory
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
 * Route definition for getting a laboratory by ID
 * @description Retrieves a specific laboratory by its ID
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
 * Route definition for updating a laboratory
 * @description Updates an existing laboratory by its ID
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
 * Route definition for deleting a laboratory
 * @description Deletes an existing laboratory by its ID
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
 * Route definition for listing laboratories with pagination
 * @description Retrieves a paginated list of laboratories
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
 * Route definition for getting all laboratories
 * @description Retrieves all laboratories without pagination
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

/**
 * @typedef {typeof createLaboratoryRoute} CreateLaboratoryRoute
 * @description Type definition for the create laboratory route
 */
export type CreateLaboratoryRoute = typeof createLaboratoryRoute

/**
 * @typedef {typeof getLaboratoryRoute} GetLaboratoryRoute
 * @description Type definition for the get laboratory route
 */
export type GetLaboratoryRoute = typeof getLaboratoryRoute

/**
 * @typedef {typeof updateLaboratoryRoute} UpdateLaboratoryRoute
 * @description Type definition for the update laboratory route
 */
export type UpdateLaboratoryRoute = typeof updateLaboratoryRoute

/**
 * @typedef {typeof deleteLaboratoryRoute} DeleteLaboratoryRoute
 * @description Type definition for the delete laboratory route
 */
export type DeleteLaboratoryRoute = typeof deleteLaboratoryRoute

/**
 * @typedef {typeof listLaboratoriesRoute} ListLaboratoriesRoute
 * @description Type definition for the list laboratories route
 */
export type ListLaboratoriesRoute = typeof listLaboratoriesRoute

/**
 * @typedef {typeof getAllLaboratoriesRoute} GetAllLaboratoriesRoute
 * @description Type definition for the get all laboratories route
 */
export type GetAllLaboratoriesRoute = typeof getAllLaboratoriesRoute
