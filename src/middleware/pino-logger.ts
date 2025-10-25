import type { Context, MiddlewareHandler } from 'hono'
import type { Env } from 'hono-pino'
import type { AppBindings } from '@/lib/types/app-types'
import { pinoLogger } from 'hono-pino'
import pino from 'pino'
import * as PinoPretty from 'pino-pretty'

/**
 * Creates a Pino logger middleware for Hono applications.
 *
 * This function sets up a logging middleware that integrates with Pino,
 * providing structured logging with request IDs and environment-specific
 * formatting (pretty printing in development).
 *
 * @returns A Hono middleware handler that adds logging functionality
 */
function logger() {
 return ((c, next) => pinoLogger({
    pino: pino({
      level: c.env.LOG_LEVEL || 'info',
    }, c.env.NODE_ENV === 'production' ? undefined : PinoPretty.PinoPretty()),
    http: {
      reqId: () => crypto.randomUUID(),
    },
  })(c as unknown as Context<Env>, next)) satisfies MiddlewareHandler<AppBindings>
}

export default logger
