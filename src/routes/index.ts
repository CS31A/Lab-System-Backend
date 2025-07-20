import { createRoute, z } from '@hono/zod-openapi'
import { createRouter } from '@/lib/create-app'
import jsonContent from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

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

export default router
