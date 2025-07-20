import { z } from 'zod'

const EnvSchema = z.object({
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  NODE_ENV: z.string(),
  DATABASE_URL: z.string(),
})

export type Environment = z.infer<typeof EnvSchema>

export function parseEnv(data: any) {
  const { data: env, error } = EnvSchema.safeParse(data)

  if (error) {
    throw new Error(JSON.stringify(error))
  }

  return env
}
