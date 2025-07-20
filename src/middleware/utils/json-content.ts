import type { ZodSchema } from '@/lib/types/zod-types'

function jsonContent<
  T extends ZodSchema,
>(schema: T, description: string) {
  return {
    content: {
      'application/json': {
        schema,
      },
    },
    description,
  }
}

export default jsonContent

export function jsonContentRequired<
  T extends ZodSchema,
>(schema: T, description: string) {
  return {
    ...jsonContent(schema, description),
    required: true,
  }
}
