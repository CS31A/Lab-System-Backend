/**
 * @fileoverview Pagination schema definitions for API responses
 * Defines the structure for pagination parameters and responses throughout the application
 */

import { z } from '@hono/zod-openapi'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants'

/**
 * Zod schema for pagination query parameters
 *
 * @description Defines the structure for pagination query parameters that can be passed to API endpoints
 *
 * @property {number} page - The page number to retrieve (minimum: 1, default: 1)
 * @property {number} limit - The number of items per page (minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE)
 *
 * @example
 * // Query: ?page=2&limit=20
 * {
 *   page: 2,
 *   limit: 20
 * }
 */
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

/**
 * Zod schema for pagination response metadata
 *
 * @description Defines the structure for pagination metadata returned in API responses
 *
 * @property {number} page - The current page number
 * @property {number} limit - The number of items per page
 * @property {number} total - The total number of items available
 * @property {number} totalPages - The total number of pages available
 * @property {boolean} hasNext - Whether there is a next page available
 * @property {boolean} hasPrev - Whether there is a previous page available
 *
 * @example
 * {
 *   page: 1,
 *   limit: 10,
 *   total: 50,
 *   totalPages: 5,
 *   hasNext: true,
 *   hasPrev: false
 * }
 */
export const pagination = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
})
