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
 * Create subject route
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
 * Get subject by ID route
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
 * Update subject route
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
 * Delete subject route
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
 * List subjects route with pagination
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
 * Get all subjects route
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

export type CreateSubjectRoute = typeof createSubjectRoute

export type GetSubjectRoute = typeof getSubjectRoute

export type UpdateSubjectRoute = typeof updateSubjectRoute

export type DeleteSubjectRoute = typeof deleteSubjectRoute

export type ListSubjectsRoute = typeof listSubjectsRoute

export type GetAllSubjectsRoute = typeof getAllSubjectsRoute
