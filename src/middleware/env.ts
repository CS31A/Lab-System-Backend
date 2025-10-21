import { z } from 'zod'

const EnvSchema = z.object({
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  NODE_ENV: z.string(),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  BCRYPT_COST: z.string().default('10'),
  // Email configuration
  RESEND_API_KEY: z.string().optional(), // For Resend email service
  SMTP_FROM: z.string().optional(), // Email sender address
  // App configuration
  APP_URL: z.string().default('http://localhost:5173'), // Frontend URL for reset links
  RESET_TOKEN_EXPIRY_HOURS: z.string().default('1'), // Token expiry in hours
})

export type Environment = z.infer<typeof EnvSchema>

export function parseEnv(data: any) {
  const { data: env, error } = EnvSchema.safeParse(data)

  if (error) {
    throw new Error(JSON.stringify(error))
  }

  return env
}
