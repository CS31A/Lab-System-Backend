# Handlers Directory

This directory contains all business logic handlers for API endpoints. Handlers are responsible for processing validated requests, executing business operations, and returning appropriate responses.

## 📁 Directory Structure

```
handlers/
├── README.md              # This file - handler patterns and guidelines
└── users/
    └── create-user.handler.ts    # User creation business logic
```

## 🏗️ Handler Architecture

Handlers are the **business logic layer** that sits between routes and data access:

```
Route Definition → Handler (Business Logic) → Database/External APIs → Response
```

### Key Responsibilities:

- ✅ **Business logic** execution
- ✅ **Data transformation** and processing
- ✅ **Database operations** via Drizzle ORM
- ✅ **Error handling** and logging
- ✅ **Response formatting**

### What Handlers DON'T Do:

- ❌ **Input validation** (handled by OpenAPI middleware)
- ❌ **Authentication** (handled by auth middleware)
- ❌ **Route definitions** (handled in routes/)

## 🚀 Creating a New Handler

### Step 1: Create Handler File

```typescript
/**
 * @fileoverview Brief description of handler purpose and business context
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { YourRouteType } from '@/routes/feature/feature.route'
import { createDb } from '@/db'
import { yourTable } from '@/db/schema'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Brief description of what this handler does and key business logic.
 * Include any important security, performance, or business considerations.
 */
export const YourHandler: AppRouteHandler<YourRouteType> = async (c) => {
  // 1. Extract validated data (already validated by OpenAPI middleware)
  const validatedData = c.req.valid('json')

  try {
    // 2. Execute business logic
    const processedData = await processBusinessLogic(validatedData)

    // 3. Database operations
    const db = createDb(c)
    const [result] = await db
      .insert(yourTable)
      .values(processedData)
      .returning()

    // 4. Transform response (remove sensitive data)
    const { sensitiveField, ...safeData } = result

    // 5. Return success response
    return c.json(
      {
        message: 'Operation completed successfully',
        data: safeData,
      },
      httpStatusCodes.CREATED,
    )
  }
  catch (err) {
    // 6. Error handling with context logging
    c.var.logger.error('Operation failed', {
      error: err.message,
      context: { userId: validatedData.id }
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: (err as Error).message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
```

### Step 2: Export Handler

```typescript
// At the end of your handler file
export * from './your-handler.handler'
```

## 🔧 Handler Patterns

### 1. Data Extraction Pattern

```typescript
export const Handler: AppRouteHandler<RouteType> = async (c) => {
  // Request body (POST/PUT/PATCH)
  const body = c.req.valid('json')

  // Path parameters (/users/{id})
  const { id } = c.req.valid('param')

  // Query parameters (?page=1&limit=10)
  const { page, limit } = c.req.valid('query')

  // Headers (if needed)
  const authHeader = c.req.header('authorization')
}
```

### 2. Database Operations Pattern

```typescript
import { createDb } from '@/db'
import { teachers, users } from '@/db/schema'

export const Handler: AppRouteHandler<RouteType> = async (c) => {
  const db = createDb(c)

  // Single insert
  const [newUser] = await db
    .insert(users)
    .values(userData)
    .returning()

  // Query with joins
  const userWithProfile = await db
    .select()
    .from(users)
    .leftJoin(teachers, eq(users.id, teachers.user_id))
    .where(eq(users.id, userId))

  // Transaction for multiple operations
  const result = await db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values(userData).returning()
    const [profile] = await tx.insert(teachers).values({
      user_id: user.id,
      ...profileData
    }).returning()

    return { user, profile }
  })
}
```

### 3. Error Handling Pattern

```typescript
export const Handler: AppRouteHandler<RouteType> = async (c) => {
  try {
    // Business logic here
  }
  catch (err) {
    // Log with context for debugging
    c.var.logger.error('Operation failed', {
      error: err.message,
      stack: err.stack,
      context: {
        userId: validatedData.userId,
        operation: 'user_creation',
        timestamp: new Date().toISOString()
      }
    })

    // Handle specific error types
    if (err.code === '23505') { // PostgreSQL unique violation
      return c.json(
        {
          message: 'Resource already exists',
          errors: 'Email or username already taken',
        },
        httpStatusCodes.CONFLICT,
      )
    }

    // Generic error response
    return c.json(
      {
        message: 'Internal Server Error',
        errors: (err as Error).message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
```

### 4. Response Transformation Pattern

```typescript
export const Handler: AppRouteHandler<RouteType> = async (c) => {
  const result = await someOperation()

  // Remove sensitive fields
  const { password, internalId, ...safeData } = result

  // Transform data structure
  const transformedData = {
    id: result.id,
    profile: {
      name: result.name,
      email: result.email,
    },
    metadata: {
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    }
  }

  return c.json({
    message: 'Success',
    data: transformedData,
  })
}
```

## 🛡️ Security Best Practices

### 1. Data Sanitization

```typescript
// ✅ Always remove sensitive data from responses
const { password, resetToken, ...safeUser } = user

// ✅ Validate business rules beyond schema validation
if (userData.user_type === 'admin' && !isAuthorizedToCreateAdmin(currentUser)) {
  return c.json({ message: 'Insufficient permissions' }, httpStatusCodes.FORBIDDEN)
}
```

### 2. Password Handling

```typescript
import bcrypt from 'bcryptjs'

// ✅ Hash passwords with appropriate salt rounds
const hashedPassword = await bcrypt.hash(plainPassword, 10)

// ✅ Compare passwords securely
const isValid = await bcrypt.compare(plainPassword, hashedPassword)
```

### 3. Logging Security

```typescript
// ✅ Log context without sensitive data
c.var.logger.error('Login failed', {
  email: userData.email, // OK - not sensitive
  timestamp: new Date(),
  // password: userData.password  // ❌ Never log passwords
})
```

## 🚀 Performance Best Practices

### 1. Database Optimization

```typescript
// ✅ Use select() to limit returned fields
const users = await db
  .select({
    id: users.id,
    email: users.email,
    username: users.username,
  })
  .from(users)

// ✅ Use transactions for multiple related operations
await db.transaction(async (tx) => {
  // Multiple operations here
})

// ✅ Use proper indexing (handled in schema/migrations)
```

### 2. Error Handling Performance

```typescript
// ✅ Fail fast for business rule violations
if (!isValidBusinessRule(data)) {
  return c.json({ message: 'Invalid operation' }, httpStatusCodes.BAD_REQUEST)
}

// ✅ Use early returns to avoid deep nesting
if (error) {
  return handleError(error)
}
```

## 📋 Testing Handlers

### Unit Test Example

```typescript
// tests/handlers/users/create-user.test.ts
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateUserHandler } from '@/handlers/users/create-user.handler'

describe('CreateUserHandler', () => {
  it('should create user successfully', async () => {
    const mockContext = createMockContext({
      body: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        user_type: 'teacher'
      }
    })

    const response = await CreateUserHandler(mockContext)

    expect(response.status).toBe(201)
    expect(response.data.email).toBe('test@example.com')
    expect(response.data.password).toBeUndefined() // Sensitive data removed
  })
})
```

## 🔍 Common Patterns by Operation

### CREATE Operations

```typescript
export const CreateHandler: AppRouteHandler<CreateRoute> = async (c) => {
  const validatedData = c.req.valid('json')

  try {
    // 1. Business logic validation
    await validateBusinessRules(validatedData)

    // 2. Data transformation
    const processedData = transformForStorage(validatedData)

    // 3. Database insertion
    const db = createDb(c)
    const [created] = await db.insert(table).values(processedData).returning()

    // 4. Response transformation
    const { sensitiveField, ...response } = created

    return c.json({
      message: 'Created successfully',
      data: response,
    }, httpStatusCodes.CREATED)
  }
  catch (err) {
    return handleError(c, err, 'Creation failed')
  }
}
```

### READ Operations

```typescript
export const GetHandler: AppRouteHandler<GetRoute> = async (c) => {
  const { id } = c.req.valid('param')

  try {
    const db = createDb(c)
    const result = await db
      .select()
      .from(table)
      .where(eq(table.id, id))
      .limit(1)

    if (!result.length) {
      return c.json(
        { message: 'Resource not found' },
        httpStatusCodes.NOT_FOUND
      )
    }

    return c.json({
      message: 'Success',
      data: result[0],
    })
  }
  catch (err) {
    return handleError(c, err, 'Fetch failed')
  }
}
```

### UPDATE Operations

```typescript
export const UpdateHandler: AppRouteHandler<UpdateRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const updateData = c.req.valid('json')

  try {
    const db = createDb(c)

    // Check if resource exists
    const existing = await db.select().from(table).where(eq(table.id, id))
    if (!existing.length) {
      return c.json({ message: 'Resource not found' }, httpStatusCodes.NOT_FOUND)
    }

    // Update with timestamp
    const [updated] = await db
      .update(table)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(table.id, id))
      .returning()

    return c.json({
      message: 'Updated successfully',
      data: updated,
    })
  }
  catch (err) {
    return handleError(c, err, 'Update failed')
  }
}
```

### DELETE Operations

```typescript
export const DeleteHandler: AppRouteHandler<DeleteRoute> = async (c) => {
  const { id } = c.req.valid('param')

  try {
    const db = createDb(c)

    // Soft delete (recommended)
    const [deleted] = await db
      .update(table)
      .set({ deleted_at: new Date() })
      .where(eq(table.id, id))
      .returning()

    // Or hard delete
    // await db.delete(table).where(eq(table.id, id))

    return c.json({
      message: 'Deleted successfully',
    })
  }
  catch (err) {
    return handleError(c, err, 'Delete failed')
  }
}
```

## 📚 Related Documentation

- Routes: `src/routes/README.md`
- Database schemas: `src/db/schema.ts`
- Middleware: `src/middleware/README.md`
- Types: `src/lib/types/app-types.ts`
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Hono Context API](https://hono.dev/api/context)
