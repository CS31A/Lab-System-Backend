import type { Context, MiddlewareHandler } from 'hono'
import type { Env } from 'hono-pino'
import type { AppBindings } from '@/lib/types/app-types'
import { pinoLogger } from 'hono-pino'
import pino from 'pino'
import * as PinoPretty from 'pino-pretty'

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
