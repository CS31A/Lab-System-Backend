/**
 * @fileoverview Root routes - API welcome and health check endpoints
 */

import { createRoute, z } from '@hono/zod-openapi'
import { createRouter } from '@/lib/create-app'
import jsonContent from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * API welcome message route
 * @description Provides a welcome message for the API root endpoint
 */
const router = createRouter()
  .openapi(createRoute({
    tags: ['Index'],
    method: 'get',
    path: '/',
    responses: {
      [httpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
        }),
        'Root route of the API',
      ),
    },
  }), (c) => {
    return c.json({
      message: 'Hono API',
    })
  })
/**
 * Health check for monitoring
 * @description Provides health status information for monitoring systems
 */
  .openapi(createRoute({
    tags: ['Health Check'],
    method: 'get',
    path: '/health',
    responses: {
      [httpStatusCodes.OK]: jsonContent(
        z.object({
          message: z.string(),
          status: z.string(),
          timestamp: z.string(),
        }),
        'Health Check Endpoint of the API',
      ),
    },
  }), (c) => {
    return c.json({
      message: 'Server is running',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  })

export default router
