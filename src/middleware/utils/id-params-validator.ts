import { z } from '@hono/zod-openapi'

const IdParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: 'id',
      in: 'path',
      required: true,
    },
    required: ['id'],
    example: 'sD1ALkjgIPno',
  }),
})

export default IdParamsSchema
