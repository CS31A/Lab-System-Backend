# Contributing to Lab System Backend

Welcome to the Lab System Backend project! This guide will help you set up your development environment and understand how to contribute to the project.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Bun** (v1.0.0 or later) - [Installation Guide](https://bun.sh/docs/installation)
- **Node.js** (v18.0.0 or later) - Required for some dependencies
- **PostgreSQL** database (local or cloud-hosted like Neon)
- **Git** for version control

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lab-system-backend
```

### 2. Install Dependencies

This project uses **Bun** as the package manager instead of npm:

```bash
bun install
```

### 3. Environment Configuration

#### Create `.dev.vars` File (Cloudflare Workers Local Development)

Copy the example file and configure your local development variables:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your actual values:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/lab_system_db

# Logger
# Options: info | fatal | error | warn | debug | trace | silent
LOG_LEVEL=debug

# Node Environment
# Options: development | production
NODE_ENV=development
```

#### Create `.env` File (General Environment Variables)

Copy the example file and configure your environment:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/lab_system_db

# Logger
LOG_LEVEL=debug

# Node Environment
NODE_ENV=development
```

### 4. Database Setup

#### Option A: Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a new database:
   ```sql
   CREATE DATABASE lab_system_db;
   ```
3. Update your `DATABASE_URL` in both `.env` and `.dev.vars`

#### Option B: Neon (Cloud PostgreSQL)

1. Sign up at [Neon](https://neon.tech/)
2. Create a new project and database
3. Copy the connection string to your environment files

#### Run Database Migrations

Generate and apply database schema:

```bash
# Generate migration files (if schema changes)
bun run drizzle-kit generate

# Push schema to database
bun run drizzle-kit push
```

### 5. Development Server

Start the development server:

```bash
bun run dev
```

The server will start on `http://localhost:8787` (default Wrangler port).

## 📜 Available Scripts

### Core Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Development** | `bun run dev` | Start development server with hot reload |
| **Build & Deploy** | `bun run deploy` | Deploy to Cloudflare Workers (production) |
| **Type Generation** | `bun run cf-typegen` | Generate TypeScript types for Cloudflare bindings |

### Code Quality Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Lint** | `bun run lint` | Run ESLint to check code quality |
| **Lint Fix** | `bun run lint:fix` | Automatically fix linting issues |

### Database Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Generate Migration** | `bunx drizzle-kit generate` | Generate new migration files |
| **Push Schema** | `bunx drizzle-kit push` | Push schema changes to database |
| **Studio** | `bunx drizzle-kit studio` | Open Drizzle Studio (database GUI) |

## 🏗️ Project Architecture

### Directory Structure

```
src/
├── index.ts                    # Main application entry point
├── db/                         # Database layer
│   ├── index.ts               # Database connection factory
│   └── schema.ts              # Drizzle schemas & Zod validation
├── lib/                       # Core application utilities
│   ├── create-app.ts          # App factory with middleware
│   ├── openapi-configuration.ts # API docs setup
│   └── types/                 # TypeScript definitions
├── middleware/                # Request processing middleware
│   ├── env.ts                 # Environment validation
│   ├── pino-logger.ts         # Logging middleware
│   └── utils/                 # Utility middleware
├── routes/                    # API route definitions
│   ├── index.ts               # Root routes
│   ├── users/                 # User management routes
│   └── teachers/              # Teacher management routes
├── handlers/                  # Business logic implementations
│   ├── users/                 # User-related handlers
│   └── teachers/              # Teacher-related handlers
└── openapi/                   # OpenAPI utilities
```

### Development Workflow

1. **Route Definition** (`*.route.ts`) - Define OpenAPI specs and validation
2. **Handler Implementation** (`handlers/`) - Implement business logic
3. **Route Registration** (`*.index.ts`) - Connect routes with handlers
4. **Testing** - Test endpoints using the auto-generated documentation

## 🔧 Development Guidelines

### Adding New Features

#### 1. Create Route Definition

```typescript
// src/routes/feature/feature.route.ts
import { createRoute, z } from '@hono/zod-openapi'
import jsonContent from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

export const createFeatureRoute = createRoute({
  tags: ['Feature'],
  method: 'post',
  path: '/features',
  request: {
    body: jsonContentRequired(featureSchema, 'Feature data'),
  },
  responses: {
    [httpStatusCodes.CREATED]: jsonContent(
      featureResponseSchema,
      'Feature created successfully'
    ),
  },
})
```

#### 2. Implement Handler

```typescript
// src/handlers/feature/create-feature.handler.ts
import type { AppRouteHandler } from '@/lib/types/app-types'
import type { CreateFeatureRoute } from '@/routes/feature/feature.route'

export const CreateFeatureHandler: AppRouteHandler<CreateFeatureRoute> = async (c) => {
  const validatedBody = c.req.valid('json')
  
  try {
    // Business logic here
    const db = createDb(c)
    // Database operations...
    
    return c.json({ message: 'Success', data: result }, 201)
  } catch (err) {
    c.var.logger.error('Feature creation failed', { error: err.message })
    return c.json({ message: 'Internal Server Error' }, 500)
  }
}
```

#### 3. Register Route

```typescript
// src/routes/feature/feature.index.ts
import * as handlers from '@/handlers/feature/create-feature.handler'
import { createRouter } from '@/lib/create-app'
import * as routes from '@/routes/feature/feature.route'

const router = createRouter()
  .openapi(routes.createFeatureRoute, handlers.CreateFeatureHandler)

export default router
```

#### 4. Add to Main App

```typescript
// src/index.ts
import feature from '@/routes/feature/feature.index'

const routes = [index, users, teachers, feature] // Add your route

routes.forEach(route => app.route('/', route))
```

### Database Schema Changes

1. **Update Schema** (`src/db/schema.ts`)
2. **Generate Migration**: `bunx drizzle-kit generate`
3. **Apply Migration**: `bunx drizzle-kit push`

### Code Style

- Use **TypeScript** for all files
- Follow **ESLint** configuration
- Use **Zod** for validation schemas
- Include **JSDoc** comments for functions
- Use **async/await** for asynchronous operations

## 🧪 Testing

### Unit Testing with Vitest

This project uses **Vitest** for unit testing, which provides excellent TypeScript support and is optimized for Vite-based projects.

#### Setting Up Tests

1. **Install Vitest** (if not already installed):
   ```bash
   bun add -d vitest @vitest/ui
   ```

2. **Add Test Scripts** to `package.json`:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:run": "vitest run",
       "test:coverage": "vitest run --coverage"
     }
   }
   ```

3. **Create Vitest Config** (`vitest.config.ts`):
   ```typescript
   import { defineConfig } from 'vitest/config'
   import path from 'path'

   export default defineConfig({
     test: {
       globals: true,
       environment: 'node',
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   })
   ```

#### Writing Unit Tests

Create test files alongside your source files with `.test.ts` or `.spec.ts` extension:

```typescript
// src/handlers/users/create-user.handler.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestApp } from '@/lib/create-app'
import { CreateUserHandler } from './create-user.handler'

describe('CreateUserHandler', () => {
  let app: any

  beforeEach(() => {
    app = createTestApp()
    // Mock database and other dependencies
    vi.clearAllMocks()
  })

  it('should create a user successfully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      user_type: 'teacher'
    }

    const response = await app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })

    expect(response.status).toBe(201)
    const result = await response.json()
    expect(result.message).toBe('User created successfully')
    expect(result.data.email).toBe(userData.email)
  })

  it('should return error for invalid email', async () => {
    const userData = {
      username: 'testuser',
      email: 'invalid-email',
      password: 'Password123',
      confirmPassword: 'Password123',
      user_type: 'teacher'
    }

    const response = await app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })

    expect(response.status).toBe(422) // Unprocessable Entity
  })
})
```

#### Testing Database Operations

For testing database operations, consider using:

1. **In-Memory Database**:
   ```typescript
   import { drizzle } from 'drizzle-orm/better-sqlite3'
   import Database from 'better-sqlite3'

   const sqlite = new Database(':memory:')
   const testDb = drizzle(sqlite)
   ```

2. **Test Database**:
   ```typescript
   // Use a separate test database
   const TEST_DATABASE_URL = 'postgresql://user:pass@localhost:5432/lab_system_test'
   ```

3. **Mocked Database**:
   ```typescript
   import { vi } from 'vitest'

   vi.mock('@/db', () => ({
     createDb: vi.fn(() => ({
       insert: vi.fn().mockReturnValue({
         values: vi.fn().mockReturnValue({
           returning: vi.fn().mockResolvedValue([mockUser])
         })
       })
     }))
   }))
   ```

#### Running Tests

```bash
# Run tests in watch mode
bun run test

# Run tests once
bun run test:run

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

#### Test Organization

```
src/
├── handlers/
│   ├── users/
│   │   ├── create-user.handler.ts
│   │   └── create-user.handler.test.ts
│   └── teachers/
│       ├── get-teachers.handler.ts
│       └── get-teachers.handler.test.ts
├── middleware/
│   ├── utils/
│   │   ├── json-content.ts
│   │   └── json-content.test.ts
└── __tests__/
    ├── setup.ts              # Test setup and utilities
    └── fixtures/             # Test data fixtures
```

### Integration Testing

For testing complete API flows:

```typescript
// src/__tests__/integration/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '@/index'

describe('Users API Integration', () => {
  beforeAll(async () => {
    // Setup test database
    // Run migrations
  })

  afterAll(async () => {
    // Cleanup test database
  })

  it('should handle complete user creation flow', async () => {
    const response = await app.request('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'integrationtest',
        email: 'integration@test.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        user_type: 'teacher'
      })
    })

    expect(response.status).toBe(201)
    
    // Verify user was created in database
    // Test related endpoints
  })
})
```

### API Testing

1. **Start Development Server**: `bun run dev`
2. **Open API Documentation**: `http://localhost:8787/reference`
3. **Test Endpoints**: Use the interactive Scalar API documentation

### Manual Testing

```bash
# Health check
curl http://localhost:8787/health

# Create user
curl -X POST http://localhost:8787/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "user_type": "teacher"
  }'

# Get teachers with pagination
curl "http://localhost:8787/teachers?page=1&limit=10"
```

### Testing Best Practices

1. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
2. **Mock External Dependencies**: Database, APIs, file system
3. **Test Edge Cases**: Invalid inputs, error conditions, boundary values
4. **Use Descriptive Names**: Test names should clearly describe what they test
5. **Keep Tests Independent**: Each test should be able to run in isolation
6. **Test Coverage**: Aim for high coverage but focus on critical paths

### Continuous Integration

Add test commands to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run test:run
```

## 📚 API Documentation

- **Interactive Docs**: `http://localhost:8787/reference`
- **OpenAPI Spec**: `http://localhost:8787/docs`

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Verify connection string format
DATABASE_URL=postgresql://username:password@host:port/database
```

#### Environment Variables Not Loading
```bash
# Ensure files exist
ls -la .env .dev.vars

# Check file permissions
chmod 644 .env .dev.vars
```

#### Bun Installation Issues
```bash
# Reinstall Bun
curl -fsSL https://bun.sh/install | bash

# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install
```

### Development Server Issues

#### Port Already in Use
```bash
# Kill process on port 8787
lsof -ti:8787 | xargs kill -9

# Or use different port
bun run dev --port 3000
```

#### Hot Reload Not Working
```bash
# Restart development server
bun run dev
```

## 🚀 Deployment

### Cloudflare Workers

1. **Configure Wrangler**: Ensure `wrangler.jsonc` is properly configured
2. **Set Environment Variables**: Configure production variables in Cloudflare dashboard
3. **Deploy**: `bun run deploy`

### Environment Variables for Production

Set these in your Cloudflare Workers dashboard:

- `DATABASE_URL` - Production database connection string
- `LOG_LEVEL` - Production log level (usually 'info' or 'warn')
- `NODE_ENV` - Set to 'production'

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Pull Request Guidelines

- Include a clear description of changes
- Add tests for new features
- Update documentation if needed
- Ensure all linting passes
- Follow the existing code style

## 📞 Support

If you encounter any issues or have questions:

1. Check this CONTRIBUTION.md file
2. Review existing issues in the repository
3. Create a new issue with detailed information
4. Include error messages, logs, and steps to reproduce

## 📄 License

This project is licensed under the terms specified in the LICENSE file.

---

Happy coding! 🎉