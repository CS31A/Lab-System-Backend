import type { Context } from 'hono'
import { neon, Pool } from '@neondatabase/serverless'
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http'
import { drizzle as drizzleWebsockets } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

export function createDb(c: Context) {
  if (!c.env.DATABASE_URL)
    throw new Error('Database URL is required')

  const db = drizzleHttp(neon(c.env.DATABASE_URL as string), { schema })
  return db
}

export function createServerlessDb(c: Context) {
  if (!c.env.DATABASE_URL)
    throw new Error('Database URL is required')

  // const pool = new Pool({ connectionString: c.env.DATABASE_URL as string })

  // const db = drizzleWebsockets(c.env.DATABASE_URL as string)
  const db = drizzleWebsockets({ client: new Pool({ connectionString: c.env.DATABASE_URL as string }) })
  return db
}
