import type { Context } from 'hono'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

export function createDb(c: Context) {
  if (!c.env.DATABASE_URL)
    throw new Error('Database URL is required')

  const db = drizzle({ client: neon(c.env.DATABASE_URL as string) })

  return db
}
