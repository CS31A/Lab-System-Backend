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
  // Email configuration
  SENDGRID_API_KEY: z.string().optional(), // For SendGrid email service
  SENDGRID_TEMPLATE_ID: z.string().optional(), // SendGrid template ID for password reset
  RESEND_API_KEY: z.string().optional(), // For Resend email service
  SMTP_FROM: z.string().optional(), // Email sender address
  // App configuration
  APP_URL: z.string().default('http://localhost:5173'), // Frontend URL for reset links
  RESET_TOKEN_EXPIRY_HOURS: z.string().default('1'), // Token expiry in hours
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
 * This function takes raw environment data and validates it against the
 * predefined Zod schema, returning properly typed environment variables.
 * If validation fails, it throws an error with detailed validation information.
 *
 * @param data - The environment data to validate (typically process.env)
 * @returns {Environment} The validated and typed environment variables that conform to the Environment type
 * @throws {Error} When environment variable validation fails, with detailed validation errors in JSON format
 *
 * @example
 * ```typescript
 * import { parseEnv } from '@/middleware/env'
 *
 * try {
 *   const env = parseEnv(process.env)
 *   console.log(env.NODE_ENV) // Properly typed
 * } catch (error) {
 *   console.error('Environment validation failed:', error)
 * }
 * ```
 */
export function parseEnv(data: any) {
  const { data: env, error } = EnvSchema.safeParse(data)

  if (error) {
    throw new Error(JSON.stringify(error))
  }

  return env
}
