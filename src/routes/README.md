# Routes Directory

This directory contains all API route definitions for the Lab System Backend. Routes are organized by feature and follow a consistent pattern for OpenAPI integration, validation, and error handling.

## 📁 Directory Structure

```
routes/
├── README.md              # This file - routing patterns and guidelines
├── index.ts               # Root routes (/, /health)
└── users/
    ├── users.index.ts     # User router - connects routes with handlers
    └── users.route.ts     # User route definitions with OpenAPI specs
```

## 🏗️ Route Architecture Pattern

Our routing follows a **separation of concerns** pattern:

1. **Route Definition** (`*.route.ts`) - OpenAPI specifications and validation schemas
2. **Route Registration** (`*.index.ts`) - Connects routes with handlers
3. **Route Handlers** (`../handlers/`) - Business logic implementation

## 🚀 Creating a New Route

### Step 1: Define the Route (`feature.route.ts`)

```typescript
/**
 * @fileoverview Feature route definitions with OpenAPI specifications
 */

import { createRoute, z } from '@hono/zod-openapi'
import { someSchema } from '@/db/schema'
import jsonContent, { jsonContentRequired } from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Brief description of what this route does and any business logic context.
 */
export const createFeatureRoute = createRoute({
  tags: ['Feature'], // OpenAPI grouping
  method: 'post', // HTTP method
  path: '/features', // URL path
  request: {
    body: jsonContentRequired( // Request validation
      someSchema,
      'Description for OpenAPI docs'
    )
  },
  responses: {
    [httpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        data: someSchema.omit({ sensitiveField: true }),
      }),
      'Success response description',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Validation failed',
    ),
  },
})

export type CreateFeatureRoute = typeof createFeatureRoute
```

### Step 2: Register the Route (`feature.index.ts`)

```typescript
/**
 * @fileoverview Feature router - connects routes with handlers
 */

import * as handlers from '@/handlers/features/create-feature.handler'
import { createRouter } from '@/lib/create-app'
import * as routes from './feature.route'

/**
 * Brief description of router capabilities and business context.
 */
const router = createRouter()
  .openapi(routes.createFeatureRoute, handlers.CreateFeatureHandler)

export default router
```

### Step 3: Create the Handler (`../handlers/features/create-feature.handler.ts`)

```typescript
/**
 * @fileoverview Feature creation handler with business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { CreateFeatureRoute } from '@/routes/features/feature.route'

/**
 * Brief description of handler purpose and key business logic.
 */
export const CreateFeatureHandler: AppRouteHandler<CreateFeatureRoute> = async (c) => {
  const validatedBody = c.req.valid('json')

  // Implementation here...
}
```

### Step 4: Register in Main App (`../index.ts`)

```typescript
import features from '@/routes/features/feature.index'

const routes = [index, users, features] // Add your new router
```

## 🔧 OpenAPI Integration

### Why `.openapi()` Instead of `.post()` or `.get()`?

```typescript
// ❌ Regular Hono route - no validation, no docs
router.post('/users', (c) => { /* handler */ })

// ✅ OpenAPI route - validation + docs + type safety
router.openapi(createRoute({...}), handler)
```

**Benefits of `.openapi()`:**

- **Automatic validation** of request/response data
- **Generated documentation** at `/docs` and `/reference`
- **Type safety** between route definition and handler
- **Consistent error handling** via default hooks
- **Client code generation** capabilities

### `createRoute()` Method Parameters

```typescript
export const exampleRoute = createRoute({
  // Required fields
  tags: ['Users'], // Groups routes in OpenAPI docs
  method: 'post', // HTTP method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  path: '/users/{id}', // URL path with optional parameters

  // Optional fields
  request: {
    params: IdParamsSchema, // Path parameters validation
    query: QuerySchema, // Query string validation
    body: jsonContentRequired( // Request body validation
      UserSchema,
      'User data to create'
    )
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      ResponseSchema,
      'Success response description'
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      ErrorSchema,
      'Validation error description'
    )
  },

  // Advanced options
  security: [{ bearerAuth: [] }], // Authentication requirements
  summary: 'Create a new user', // Short description
  description: 'Detailed...', // Long description
})
```

## 🛡️ Middleware Validation Workflow

### 1. Request Flow

```
Incoming Request
       ↓
[OpenAPI Validation] ← createRoute() schema
       ↓
[Default Hook] ← Handles validation errors
       ↓
[Route Handler] ← c.req.valid('json') contains validated data
       ↓
Response
```

### 2. Validation in Action

```typescript
// In your route definition
request: {
  body: jsonContentRequired(userInsertSchema, 'User data')
}

// In your handler - data is already validated!
export async function handler(c) {
  const validatedData = c.req.valid('json') // ✅ Type-safe, validated data

  // No need for manual validation - it's already done!
  // If validation failed, default hook already returned 422 error
}
```

### 3. Validation Error Handling

Validation errors are automatically handled by our **default hook** (`src/openapi/default-hook.ts`):

```typescript
const defaultHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    return c.json({
      success: result.success,
      error: result.error, // Detailed Zod validation errors
    }, UNPROCESSABLE_ENTITY) // 422 status code
  }
}
```

## 🔧 JSON Helper Functions

### `jsonContent(schema, description)`

Creates OpenAPI response specification:

```typescript
import { z } from '@hono/zod-openapi'

// Usage
responses: {
  [httpStatusCodes.OK]: jsonContent(
    z.object({
      message: z.string(),
      data: UserSchema,
    }),
    'User successfully created'
  )
}

// Generates OpenAPI spec:
{
  "content": {
    "application/json": {
      "schema": { /* Zod schema converted to JSON Schema */ }
    }
  },
  "description": "User successfully created"
}
```

### `jsonContentRequired(schema, description)`

Same as `jsonContent` but marks request body as required:

```typescript
// Usage
request: {
  body: jsonContentRequired(
    UserInsertSchema,
    'User data to create'
  )
}

// Generates OpenAPI spec with required: true
{
  "content": { /* ... */ },
  "description": "User data to create",
  "required": true
}
```

## 📋 Best Practices

### ✅ Do's

- **Use descriptive route names** that match your business domain
- **Group related routes** in the same directory
- **Keep route definitions separate** from handlers
- **Use Zod schemas** from your database schema when possible
- **Add brief JSDoc comments** for complex business logic
- **Follow consistent naming**: `createUserRoute`, `getUserRoute`, etc.

### ❌ Don'ts

- **Don't put business logic** in route definitions
- **Don't duplicate validation** - let OpenAPI handle it
- **Don't mix route definitions** with handlers in the same file
- **Don't forget to export route types** for handler type safety
- **Don't skip error response definitions** in your routes

## 🔍 Common Patterns

### Path Parameters

```typescript
import IdParamsSchema from '@/middleware/utils/id-params-validator'

export const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  request: {
    params: IdParamsSchema, // Validates { id: string }
  },
  // ...
})

// In handler
const { id } = c.req.valid('param') // ✅ Validated path params
```

### Query Parameters

```typescript
const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
})

export const listUsersRoute = createRoute({
  method: 'get',
  path: '/users',
  request: {
    query: QuerySchema,
  },
  // ...
})

// In handler
const { page, limit } = c.req.valid('query') // ✅ Validated query params
```

### Error Responses

```typescript
// Standard error response pattern
import createErrorSchema from '@/middleware/utils/create-error-schema'

responses: {
  [httpStatusCodes.NOT_FOUND]: jsonContent(
    createErrorSchema(httpStatusCodes.NOT_FOUND),
    'User not found'
  ),
  [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
    createErrorSchema(httpStatusCodes.INTERNAL_SERVER_ERROR),
    'Internal server error'
  ),
}
```

## 🚀 Next Steps

1. **Check existing routes** in this directory for examples
2. **Review the database schemas** in `src/db/schema.ts` for validation
3. **Look at handlers** in `src/handlers/` for implementation patterns
4. **Test your routes** using the OpenAPI docs at `/reference`

## 📚 Related Documentation

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.3)
- [Hono OpenAPI Documentation](https://hono.dev/middleware/builtin/openapi)
- [Zod Schema Validation](https://zod.dev/)
- Database schemas: `src/db/schema.ts`
- Middleware utilities: `src/middleware/utils/`
