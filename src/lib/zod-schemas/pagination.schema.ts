import { z } from '@hono/zod-openapi'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants'

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({
    param: {
      name: 'page',
      in: 'query',
    },
    example: '1',
    description: 'Page number for pagination (default: 1)',
  }),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE).openapi({
    param: {
      name: 'limit',
      in: 'query',
    },
    example: '10',
    description: 'Number of items per page (default: 10, max: 100)',
  }),
})

export const pagination = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
})
