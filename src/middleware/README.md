# Middleware Directory

This directory contains all middleware components for request processing, validation, logging, and error handling. Middleware functions run before route handlers and provide cross-cutting concerns.

## 📁 Directory Structure

```
middleware/
├── README.md              # This file - middleware patterns and guidelines
├── env.ts                 # Environment variable validation
├── pino-logger.ts         # Request logging middleware
└── utils/
    ├── create-error-schema.ts     # OpenAPI error schema generator
    ├── id-params-validator.ts     # Path parameter validation
    ├── json-content.ts            # OpenAPI content helpers
    ├── not-found.ts               # 404 handler
    ├── on-error.ts                # Global error handler
    └── runtime-env.ts             # Runtime environment parser
```

## 🏗️ Middleware Architecture

Middleware in our application follows the **Hono middleware pattern**:

```
Request → [Middleware Chain] → Route Handler → Response
          ↓
    Logger → Validator → Auth → Business Logic
```

### Middleware Types:

1. **Global Middleware** - Applied to all routes
2. **Route-specific Middleware** - Applied to specific routes
3. **Utility Middleware** - Helper functions for common tasks
4. **Error Middleware** - Handle errors and format responses

## 🔧 Core Middleware Components

### 1. Environment Validation (`env.ts`)

Validates and parses environment variables at startup:

```typescript
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
    throw new Error(`Environment validation failed: ${JSON.stringify(error)}`)
  }

  return env
}
```

**Usage:**

```typescript
// In your app setup
import { parseEnv } from '@/middleware/env'

const env = parseEnv(process.env)
```

### 2. Request Logging (`pino-logger.ts`)

Provides structured logging for all requests:

```typescript
import { pinoLogger } from 'hono-pino'
import pino from 'pino'

function logger() {
  return pinoLogger({
    pino: pino({
      level: c.env.LOG_LEVEL || 'info',
    }, c.env.NODE_ENV === 'production' ? undefined : PinoPretty()),
    http: {
      reqId: () => crypto.randomUUID(),
    },
  })
}
```

**Features:**

- ✅ **Request ID generation** for tracing
- ✅ **Structured JSON logging** in production
- ✅ **Pretty printing** in development
- ✅ **Configurable log levels**

**Usage in handlers:**

```typescript
export async function handler(c) {
  c.var.logger.info('Processing request', { userId: 123 })
  c.var.logger.error('Operation failed', { error: err.message })
}
```

### 3. Error Handling (`on-error.ts`)

Global error handler for unhandled exceptions:

```typescript
import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

const onError: ErrorHandler = (err, c) => {
  // Handle HTTP exceptions (4xx errors)
  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  // Handle unexpected errors (5xx errors)
  const env = c.env?.NODE_ENV || process.env?.NODE_ENV
  return c.json(
    {
      message: 'Internal Server Error',
      error: err.message,
      stack: env === 'production' ? undefined : err.stack, // Hide stack in production
    },
    500,
  )
}
```

### 4. Not Found Handler (`not-found.ts`)

Handles 404 errors for undefined routes:

```typescript
import type { NotFoundHandler } from 'hono'

const notFound: NotFoundHandler = (c) => {
  return c.json({
    message: `Not Found - ${c.req.path}`,
  }, 404)
}
```

## 🛠️ Utility Middleware

### 1. JSON Content Helpers (`json-content.ts`)

Creates OpenAPI content specifications:

```typescript
import type { ZodSchema } from '@/lib/types/zod-types'

// Basic content specification
function jsonContent<T extends ZodSchema>(schema: T, description: string) {
  return {
    content: {
      'application/json': {
        schema,
      },
    },
    description,
  }
}

// Required content specification
export function jsonContentRequired<T extends ZodSchema>(
  schema: T,
  description: string
) {
  return {
    ...jsonContent(schema, description),
    required: true,
  }
}
```

**Usage:**

```typescript
// In route definitions
responses: {
  200: jsonContent(ResponseSchema, 'Success response'),
}

request: {
  body: jsonContentRequired(RequestSchema, 'Request data'),
}
```

### 2. ID Parameter Validator (`id-params-validator.ts`)

Standard validation for path parameters:

```typescript
import { z } from '@hono/zod-openapi'

const IdParamsSchema = z.object({
  id: z.string().openapi({
    param: {
      name: 'id',
      in: 'path',
      required: true,
    },
    example: 'sD1ALkjgIPno',
  }),
})

export default IdParamsSchema
```

**Usage:**

```typescript
// In route definitions
export const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  request: {
    params: IdParamsSchema,
  },
  // ...
})

// In handlers
const { id } = c.req.valid('param') // Type-safe ID extraction
```

### 3. Error Schema Generator (`create-error-schema.ts`)

Generates consistent error response schemas:

```typescript
import { z } from '@hono/zod-openapi'

export default function createErrorSchema(statusCode: number) {
  return z.object({
    message: z.string().openapi({
      example: getErrorMessage(statusCode),
    }),
    errors: z.any().optional().openapi({
      example: getErrorExample(statusCode),
    }),
  })
}

function getErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400: return 'Bad Request'
    case 401: return 'Unauthorized'
    case 403: return 'Forbidden'
    case 404: return 'Not Found'
    case 422: return 'Validation Failed'
    case 500: return 'Internal Server Error'
    default: return 'Error'
  }
}
```

## 🔐 Authentication Middleware Example

```typescript
/**
 * @fileoverview JWT authentication middleware
 */

import type { MiddlewareHandler } from 'hono'
import type { AppBindings } from '@/lib/types/app-types'
import { jwt } from 'hono/jwt'

interface JWTPayload {
  userId: string
  userType: string
  exp: number
}

export function requireAuth(): MiddlewareHandler<AppBindings> {
  return jwt({
    secret: process.env.JWT_SECRET!,
    cookie: 'auth-token', // or header: 'Authorization'
  })
}

export function requireRole(allowedRoles: string[]): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    const payload = c.get('jwtPayload') as JWTPayload

    if (!allowedRoles.includes(payload.userType)) {
      return c.json(
        { message: 'Insufficient permissions' },
        403
      )
    }

    await next()
  }
}
```

**Usage:**

```typescript
// In route registration
router
  .use('/admin/*', requireAuth(), requireRole(['admin']))
  .openapi(adminRoute, adminHandler)
```

## 🚀 Rate Limiting Middleware Example

```typescript
/**
 * @fileoverview Rate limiting middleware
 */

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (c: Context) => string
}

export function rateLimit(options: RateLimitOptions): MiddlewareHandler<AppBindings> {
  const { windowMs, maxRequests, keyGenerator = c => c.req.header('x-forwarded-for') || 'unknown' } = options
  const requests = new Map<string, { count: number, resetTime: number }>()

  return async (c, next) => {
    const key = keyGenerator(c)
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < windowStart) {
        requests.delete(k)
      }
    }

    // Check current requests
    const current = requests.get(key) || { count: 0, resetTime: now + windowMs }

    if (current.count >= maxRequests) {
      return c.json(
        {
          message: 'Too Many Requests',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        429
      )
    }

    // Increment counter
    current.count++
    requests.set(key, current)

    await next()
  }
}
```

**Usage:**

```typescript
// Apply to specific routes
router.use('/api/*', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
}))
```

## 📋 Middleware Best Practices

### ✅ Do's

- **Keep middleware focused** on single responsibilities
- **Use TypeScript types** for better type safety
- **Handle errors gracefully** and provide meaningful messages
- **Log important events** for debugging and monitoring
- **Make middleware configurable** when possible
- **Document middleware behavior** and usage

### ❌ Don'ts

- **Don't put business logic** in middleware
- **Don't forget to call `next()`** when continuing the chain
- **Don't expose sensitive information** in error messages
- **Don't create overly complex middleware** - keep it simple
- **Don't ignore performance** - middleware runs on every request

## 🔍 Common Middleware Patterns

### 1. Request Transformation

```typescript
export function transformRequest(): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    // Transform request data before handler
    const body = await c.req.json()
    const transformedBody = {
      ...body,
      timestamp: new Date().toISOString(),
    }

    // Store transformed data for handler
    c.set('transformedBody', transformedBody)

    await next()
  }
}
```

### 2. Response Transformation

```typescript
export function transformResponse(): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    await next()

    // Transform response after handler
    const response = await c.res.json()
    return c.json({
      ...response,
      serverTime: new Date().toISOString(),
    })
  }
}
```

### 3. Conditional Middleware

```typescript
export function conditionalMiddleware(
  condition: (c: Context) => boolean,
  middleware: MiddlewareHandler
): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    if (condition(c)) {
      return middleware(c, next)
    }
    await next()
  }
}
```

## 📚 Related Documentation

- Routes: `src/routes/README.md`
- Handlers: `src/handlers/README.md`
- Types: `src/lib/types/app-types.ts`
- [Hono Middleware Guide](https://hono.dev/guides/middleware)
- [Pino Logger Documentation](https://getpino.io/)
