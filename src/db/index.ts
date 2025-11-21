/**
 * @fileoverview Database connection module for Lab System Backend API.
 * Provides functions to create database connections using Drizzle ORM with Neon database.
 */
import type { Context } from 'hono'
import { neon, Pool } from '@neondatabase/serverless'
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http'
import { drizzle as drizzleWebsockets } from 'drizzle-orm/neon-serverless'
import * as schema from './schema'

/**
 * Creates a database connection using the HTTP driver for Neon database.
 * @param {Context} c - The Hono context containing environment variables
 * @returns {ReturnType<drizzleHttp>} The configured Drizzle ORM instance
 * @throws {Error} If DATABASE_URL is not provided in the context environment
 */
export function createDb(c: Context) {
  if (!c.env.DATABASE_URL)
    throw new Error('Database URL is required')

  const db = drizzleHttp(neon(c.env.DATABASE_URL as string), { schema })
  return db
}

/**
 * Creates a serverless database connection using the WebSocket driver for Neon database.
 * @param {Context} c - The Hono context containing environment variables
 * @returns {ReturnType<drizzleWebsockets>} The configured Drizzle ORM instance for serverless environments
 * @throws {Error} If DATABASE_URL is not provided in the context environment
 */
export function createServerlessDb(c: Context) {
  if (!c.env.DATABASE_URL)
    throw new Error('Database URL is required')

  // const pool = new Pool({ connectionString: c.env.DATABASE_URL as string })

  // const db = drizzleWebsockets(c.env.DATABASE_URL as string)
  const db = drizzleWebsockets({ client: new Pool({ connectionString: c.env.DATABASE_URL as string }) })
  return db
}
