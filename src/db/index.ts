import type { Context } from 'hono'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

export function createDb(c: Context) {
  const pool = mysql.createPool(c.env.DATABASE_URL as string)

  const db = drizzle({ client: pool })

  return { db, pool }
}
