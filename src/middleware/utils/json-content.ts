import type { ZodSchema } from '@/lib/types/zod-types'

/**
 * Creates a JSON content specification for OpenAPI documentation.
 *
 * This function generates an object that specifies JSON content with a given
 * schema and description, suitable for use in OpenAPI documentation.
 *
 * @param schema - The Zod schema to use for validation
 * @param description - A description of the content
 * @returns An object containing the content specification and description
 *
 * @example
 * ```typescript
 * import { createRoute, z } from '@hono/zod-openapi'
 * import jsonContent from '@/middleware/utils/json-content'
 *
 * const userSchema = z.object({
 *   id: z.number(),
 *   name: z.string()
 * })
 *
 * const userRoute = createRoute({
 *   method: 'get',
 *   path: '/users/{id}',
 *   responses: {
 *     200: jsonContent(userSchema, 'User details')
 *   }
 * })
 * ```
 */
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

/**
 * Creates a required JSON content specification for OpenAPI documentation.
 *
 * This function generates an object that specifies required JSON content
 * with a given schema and description, suitable for use in OpenAPI documentation.
 *
 * @param schema - The Zod schema to use for validation
 * @param description - A description of the content
 * @returns An object containing the content specification, description, and required flag
 */
export function jsonContentRequired<
  T extends ZodSchema,
>(schema: T, description: string) {
  return {
    ...jsonContent(schema, description),
    required: true,
  }
}
