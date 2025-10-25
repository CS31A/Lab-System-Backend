/**
 * @fileoverview Subject route definitions with OpenAPI specifications
 */

import { createRoute, z } from '@hono/zod-openapi'
import { patchSubjectSchema, subjectInsertSchema, subjectSelectSchema } from '@/db/schema'
import { pagination, paginationQuery } from '@/lib/zod-schemas'
import { errorSchema } from '@/lib/zod-schemas/error.schema'
import IdParamsSchema from '@/middleware/utils/id-params-validator'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Route definition for creating a new subject
 * @description Handles the creation of a new subject
 */
export const createSubjectRoute = createRoute({
  tags: ['Subjects'],
  method: 'post',
  path: '/subjects',
  request: {
    body: jsonContentRequired(
      subjectInsertSchema,
      'The subject to create',
    ),
  },
  responses: {
    [httpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        data: subjectSelectSchema,
      }),
      'Subject successfully created',
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
 * Route definition for getting a subject by ID
 * @description Retrieves a specific subject by its ID
 */
export const getSubjectRoute = createRoute({
  tags: ['Subjects'],
  method: 'get',
  path: '/subjects/{id}',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: subjectSelectSchema,
      }),
      'Subject successfully retrieved',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Subject not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for updating a subject
 * @description Updates an existing subject by its ID
 */
export const updateSubjectRoute = createRoute({
  tags: ['Subjects'],
  method: 'patch',
  path: '/subjects/{id}',
  request: {
    params: IdParamsSchema,
    body: jsonContent(
      patchSubjectSchema,
      'The subject data to update',
    ),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: subjectSelectSchema,
      }),
      'Subject successfully updated',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Subject not found',
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
 * Route definition for deleting a subject
 * @description Deletes an existing subject by its ID
 */
export const deleteSubjectRoute = createRoute({
  tags: ['Subjects'],
  method: 'delete',
  path: '/subjects/{id}',
  request: {
    params: IdParamsSchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Subject successfully deleted',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Subject not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for listing subjects with pagination
 * @description Retrieves a paginated list of subjects
 */
export const listSubjectsRoute = createRoute({
  tags: ['Subjects'],
  method: 'get',
  path: '/subjects',
  request: {
    query: paginationQuery,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(subjectSelectSchema),
        pagination,
      }),
      'Subjects successfully retrieved',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting all subjects
 * @description Retrieves all subjects without pagination
 */
export const getAllSubjectsRoute = createRoute({
  tags: ['Subjects'],
  method: 'get',
  path: '/subjects/all',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(subjectSelectSchema),
      }),
      'All subjects successfully retrieved',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * @typedef {typeof createSubjectRoute} CreateSubjectRoute
 * @description Type definition for the create subject route
 */

/**
 * @typedef {typeof getSubjectRoute} GetSubjectRoute
 * @description Type definition for the get subject route
 */

/**
 * @typedef {typeof updateSubjectRoute} UpdateSubjectRoute
 * @description Type definition for the update subject route
 */

/**
 * @typedef {typeof deleteSubjectRoute} DeleteSubjectRoute
 * @description Type definition for the delete subject route
 */

/**
 * @typedef {typeof listSubjectsRoute} ListSubjectsRoute
 * @description Type definition for the list subjects route
 */

/**
 * @typedef {typeof getAllSubjectsRoute} GetAllSubjectsRoute
 * @description Type definition for the get all subjects route
 */
