import { createRoute, z } from '@hono/zod-openapi'
import { teacherSelectSchema } from '@/db/schema'
import { pagination, paginationQuery } from '@/lib/zod-schemas'
import jsonContent from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

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
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Invalid query parameters',
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

export type GetTeachers = typeof getTeachersRoute
