import type { Context } from 'hono'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

export function createDb(c: Context) {
  const connection = neon(c.env.DATABASE_URL as string)

  if (!connection)
    throw new Error('Database URL is required')

  const db = drizzle({ client: connection })

  return db
}
