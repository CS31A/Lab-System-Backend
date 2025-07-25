import type { Context } from 'hono'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

export function createDb(c: Context) {
  const pool = neon(c.env.DATABASE_URL as string)

  const db = drizzle({ client: pool })

  return { db, pool }
}
