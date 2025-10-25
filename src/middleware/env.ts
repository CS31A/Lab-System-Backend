import { z } from 'zod'

/**
 * Zod schema for validating environment variables.
 *
 * This schema defines the required environment variables for the application
 * with appropriate validation rules and default values.
 */
const EnvSchema = z.object({
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  NODE_ENV: z.string(),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  BCRYPT_COST: z.string().default('10'),
})

/**
 * TypeScript type derived from the environment schema.
 *
 * Represents the validated and typed environment variables.
 */
export type Environment = z.infer<typeof EnvSchema>

/**
 * Parses and validates environment variables against the defined schema.
 *
 * @param data - The environment data to validate
 * @returns The validated and typed environment variables
 * @throws Error with validation details if parsing fails
 */
export function parseEnv(data: any) {
  const { data: env, error } = EnvSchema.safeParse(data)

  if (error) {
    throw new Error(JSON.stringify(error))
  }

  return env
}
