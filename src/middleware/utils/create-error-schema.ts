/**
 * Creates a Zod schema for error responses.
 *
 * This function generates a Zod schema that represents the structure of a
 * validation error response. The schema includes a `success` field, which is
 * always `false` for errors, and an `error` object containing details about
 * the validation issues.
 *
 * The `error` object includes an `issues` array, where each issue has a `code`,
 * `path`, and an optional `message`. The `name` of the error is also included.
 *
 * @returns A Zod schema for error responses.
 *
 * @example
 * const errorSchema = createErrorSchema();
 *
 * // Example of a valid error object according to the schema:
 * const exampleError = {
 *   success: false,
 *   error: {
 *     issues: [
 *       {
 *         code: 'invalid_type',
 *         path: ['name'],
 *         message: 'Expected string, received number',
 *       },
 *     ],
 *     name: 'ZodError',
 *   },
 * };
 */
// import { z } from '@hono/zod-openapi'

// function createErrorSchema() {
//   return z.object({
//     success: z.boolean().openapi({
//       example: false,
//     }),
//     error: z
//       .object({
//         issues: z.array(
//           z.object({
//             code: z.string(),
//             path: z.array(z.union([z.string(), z.number()])),
//             message: z.string().optional(),
//           }),
//         ),
//         name: z.string(),
//       })
//       .openapi({
//         example: {
//           issues: [
//             {
//               code: 'invalid_type',
//               path: ['name'],
//               message: 'Expected string, received number',
//             },
//           ],
//           name: 'ZodError',
//         },
//       }),
//   })
// }

import { z } from '@hono/zod-openapi'

/**
 * Creates a Zod schema for error responses with realistic examples based on the input schema.
 *
 * This function analyzes the structure of the input schema and generates relevant
 * validation error examples that would actually occur when validating against that schema.
 *
 * @param schema - The Zod schema to generate error examples for
 * @returns A Zod schema for error responses with contextual examples
 */
function createErrorSchema(schema: z.ZodType) {
  const errorExamples = generateErrorExamples(schema)

  return z.object({
    success: z.boolean().openapi({
      example: false,
    }),
    error: z
      .object({
        issues: z.array(
          z.object({
            code: z.string(),
            path: z.array(z.union([z.string(), z.number()])),
            message: z.string().optional(),
          }),
        ),
        name: z.string(),
      })
      .openapi({
        example: {
          issues: errorExamples,
          name: 'ZodError',
        },
      }),
  })
}

/**
 * Generates realistic error examples based on the schema structure
 */
function generateErrorExamples(schema: z.ZodType): Array<{
  code: string
  path: (string | number)[]
  message: string
}> {
  const _examples: Array<{
    code: string
    path: (string | number)[]
    message: string
  }> = []

  try {
    // Analyze the schema and generate appropriate bad data
    const badData = generateBadData(schema, [])

    // Run validation to get actual errors
    const result = schema.safeParse(badData)

    if (!result.success) {
      // Take the first few errors as examples (limit to 3 for clarity)
      return result.error.issues.slice(0, 3).map(issue => ({
        code: issue.code,
        path: issue.path.map(p => typeof p === 'symbol' ? p.toString() : p),
        message: issue.message || getDefaultMessage(issue.code),
      }))
    }
  }
  catch (error) {
    // Fallback to generic examples if analysis fails
    console.warn('Failed to generate schema-specific error examples:', error)
  }

  // Fallback examples
  return [
    {
      code: 'invalid_type',
      path: ['field'],
      message: 'Expected string, received number',
    },
  ]
}

/**
 * Recursively generates bad data that would cause validation errors
 */
function generateBadData(schema: z.ZodType, path: (string | number)[] = []): any {
  const def = (schema as any)._def
  const typeName = def.typeName

  switch (typeName) {
    case 'ZodString':
      // Generate invalid string data based on constraints
      if (def.checks) {
        for (const check of def.checks) {
          if (check.kind === 'email')
            return 'invalid-email'
          if (check.kind === 'url')
            return 'invalid-url'
          if (check.kind === 'uuid')
            return 'invalid-uuid'
          if (check.kind === 'min')
            return '' // Too short string
          if (check.kind === 'max')
            return 'a'.repeat(check.value + 1) // Too long
        }
      }
      return 123 // Invalid type (number instead of string)

    case 'ZodNumber':
      if (def.checks) {
        for (const check of def.checks) {
          if (check.kind === 'min')
            return check.value - 1 // Too small
          if (check.kind === 'max')
            return check.value + 1 // Too large
          if (check.kind === 'int')
            return 1.5 // Not integer
        }
      }
      return 'not-a-number' // Invalid type

    case 'ZodBoolean':
      return 'not-boolean' // Invalid type

    case 'ZodEnum':
      return 'invalid-enum-value' // Not in enum

    case 'ZodArray':
    // Generate array with invalid items
    { const itemSchema = def.type
      return [generateBadData(itemSchema, [...path, 0])] }

    case 'ZodObject':
    { const shape = def.shape()
      const badObject: any = {}

      // Generate bad data for each property
      Object.keys(shape).forEach((key, index) => {
        if (index < 3) { // Limit to first 3 properties to avoid too many errors
          badObject[key] = generateBadData(shape[key], [...path, key])
        }
      })

      return badObject }

    case 'ZodOptional':
      // For optional fields, generate bad data for the inner type
      return generateBadData(def.innerType, path)

    case 'ZodNullable':
      return generateBadData(def.innerType, path)

    case 'ZodUnion':
      // Try to generate data that doesn't match any union member
      return { invalidUnionValue: true }

    default:
      return null // Generic invalid value
  }
}

/**
 * Provides default error messages for common error codes
 */
function getDefaultMessage(code: string): string {
  const messages: Record<string, string> = {
    invalid_type: 'Invalid type provided',
    invalid_string: 'Invalid string format',
    too_small: 'Value is too small',
    too_big: 'Value is too large',
    invalid_enum_value: 'Invalid enum value',
    unrecognized_keys: 'Unrecognized keys in object',
    required_error: 'Required field is missing',
  }

  return messages[code] || 'Validation error'
}

export default createErrorSchema
