# Lab System Backend

A modern, type-safe REST API for laboratory management built with Hono.js, TypeScript, and Cloudflare Workers. This system manages laboratory schedules, equipment tracking, user roles, and seating arrangements for educational institutions.

## Project Overview

The Lab System Backend is a comprehensive laboratory management solution designed for educational institutions. It provides a robust API for managing various aspects of computer laboratory operations, including:

- **User Management**: Role-based access control for administrators, teachers, and technical staff
- **Laboratory Management**: Track and manage multiple laboratory rooms with real-time status
- **Equipment Tracking**: Monitor computer equipment conditions (monitors, keyboards, mice, cables)
- **Seating Plans**: Assign and track student seating with equipment status
- **Activity Logging**: Maintain historical records of lab usage and equipment conditions
- **Scheduling**: Manage lab class schedules and availability

The system is built using modern technologies ensuring type safety, performance, and scalability while providing an intuitive API for frontend applications.

## Technologies Used

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) with Node.js compatibility
- **Framework**: [Hono.js](https://hono.dev/) with OpenAPI integration
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/) schemas for type safety
- **Authentication**: bcryptjs for secure password hashing
- **Logging**: [Pino](https://getpino.io/) structured logging
- **Package Manager**: [Bun](https://bun.sh/)
- **Testing**: [Vitest](https://vitest.dev/) for unit and integration testing
- **Documentation**: Scalar API reference with OpenAPI specification

## Prerequisites

Before setting up the project, ensure you have the following installed on your system:

- [Bun](https://bun.sh/) (v1.0.0 or later) - Fast JavaScript runtime
- PostgreSQL database (local or cloud-hosted like Neon)
- Git for version control
- Node.js (v18.0.0 or later) - Required for some dependencies

## Installation

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

#### Create Environment Files

Copy the example environment files:

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
```

#### Configure Database Connection

Edit both `.env` and `.dev.vars` files with your database connection details:

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
# Generate migration files (if you adjusted anythig in the schema otherwise just run bun run drizzle-kit push)
bunx drizzle-kit generate

# Push schema to database
bunx drizzle-kit push
```

## Usage

### Development Server

Start the development server:

```bash
bun run dev
```

The API will be available at `http://localhost:8787`

### Available Scripts

| Script              | Command              | Description                                       |
| ------------------- | ------------------------------------------------- |
| **Development**     | `bun run dev`        | Start development server with hot reload          |
| **Build & Deploy**  | `bun run deploy`     | Deploy to Cloudflare Workers                      |
| **Type Generation** | `bun run cf-typegen` | Generate TypeScript types for Cloudflare bindings |
| **Linting**         | `bun run lint`       | Run ESLint code quality checks                    |
| **Lint Fix**        | `bun run lint:fix`   | Automatically fix linting issues                  |
| **Tests**           | `bun run test`       | Run unit and integration tests                    |
| **Generate Migration** | `bunx drizzle-kit generate` | Generate new migration files             |
| **Push Schema**     | `bunx drizzle-kit push`     | Push schema changes to database              |
| **Database Studio** | `bunx drizzle-kit studio`   | Open Drizzle Studio (database GUI)         |

### API Endpoints

#### Core Endpoints

- `GET /` - API welcome message
- `GET /health` - Health check endpoint

#### Authentication Endpoints

- `POST /auth/login` - User login with email and password
- `POST /auth/refresh` - Refresh authentication token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user information

#### User Management Endpoints

- `POST /users` - Create new user account
- `GET /users` - List users with pagination
- `GET /users/:id` - Get specific user details
- `PUT /users/:id` - Update user information
- `DELETE /users/:id` - Soft delete user
- `PATCH /users/:id/restore` - Restore soft deleted user
- `DELETE /users/:id/hard` - Permanently delete user

#### Teacher Management Endpoints

- `GET /teachers` - List teachers with pagination
- `GET /teachers/:id` - Get specific teacher details
- `GET /teachers/:id/laboratories` - Get laboratories assigned to teacher
- `GET /teachers/:id/dashboard` - Get teacher dashboard data

#### Laboratory Management Endpoints

- `GET /laboratories` - List laboratories with pagination
- `POST /laboratories` - Create new laboratory
- `GET /laboratories/:id` - Get specific laboratory details
- `PUT /laboratories/:id` - Update laboratory information
- `DELETE /laboratories/:id` - Delete laboratory

#### Subject Management Endpoints

- `GET /subjects` - List subjects with pagination
- `POST /subjects` - Create new subject
- `GET /subjects/:id` - Get specific subject details
- `PUT /subjects/:id` - Update subject information
- `DELETE /subjects/:id` - Delete subject

### API Documentation

- **Interactive Documentation**: `http://localhost:8787/reference`
- **OpenAPI Specification**: `http://localhost:8787/docs`

The API documentation provides comprehensive information about all endpoints, request/response schemas, and example usage.

### Example API Usage

#### Creating a User

```bash
curl -X POST http://localhost:8787/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePassword123",
    "confirmPassword": "SecurePassword123",
    "user_type": "teacher"
  }'
```

#### Getting Teachers with Pagination

```bash
curl "http://localhost:8787/teachers?page=1&limit=10"
```

## Project Structure

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
│   ├── auth/                  # Authentication routes
│   ├── users/                 # User management routes
│   ├── teachers/              # Teacher management routes
│   ├── laboratories/          # Laboratory management routes
│   └── subjects/              # Subject management routes
├── handlers/                  # Business logic implementations
│   ├── auth/                  # Authentication handlers
│   ├── users/                 # User-related handlers
│   ├── teachers/              # Teacher-related handlers
│   ├── laboratories/          # Laboratory-related handlers
│   └── subjects/              # Subject-related handlers
├── services/                  # Business service layer
│   ├── UserService.ts         # User business logic
│   ├── TeacherService.ts      # Teacher business logic
│   ├── LaboratoryService.ts   # Laboratory business logic
│   └── SubjectService.ts      # Subject business logic
└── openapi/                   # OpenAPI utilities
```

## API Documentation

The API provides comprehensive documentation through:

1. **Interactive API Reference**: Available at `http://localhost:8787/reference` when running the development server
2. **OpenAPI Specification**: Available at `http://localhost:8787/docs`
3. **Built-in Validation**: All endpoints include Zod schema validation with detailed error messages

The documentation includes:
- Detailed endpoint descriptions
- Request/response schemas
- Example requests and responses
- Authentication requirements
- Error codes and messages

## Contributing

We welcome contributions! Please read our [**CONTRIBUTION.md**](./CONTRIBUTION.md) for detailed information on:

- Development Environment Setup
- Code Style Guidelines
- Testing with Vitest
- Architecture Patterns
- Deployment Process
- Troubleshooting Guide

### Quick Contribution Steps

1. **Read the [CONTRIBUTION.md](./CONTRIBUTION.md)** - Essential setup and guidelines
2. **Fork** the repository
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Follow** the development patterns outlined in CONTRIBUTION.md
5. **Test** your changes thoroughly
6. **Submit** a Pull Request

## Testing

This project uses **Vitest** for unit and integration testing. See [CONTRIBUTION.md](./CONTRIBUTION.md#testing) for detailed testing guidelines.

```bash
# Run tests
bun run test

# Run tests with UI
bun run test:ui

# Run tests once
bun run test:run

# Run tests with coverage
bun run test:coverage
```

## Deployment

### Cloudflare Workers

```bash
bun run deploy
```

For detailed deployment instructions and environment configuration, see [CONTRIBUTION.md](./CONTRIBUTION.md#deployment).

## Support

- **Documentation**: Check [CONTRIBUTION.md](./CONTRIBUTION.md) for comprehensive guides
- **Issues**: Report bugs or request features via GitHub Issues
- **Questions**: Create a discussion or issue for help

## License

This project is licensed under the terms specified in the LICENSE file.

---

**Ready to contribute?** Start by reading our [**CONTRIBUTION.md**](./CONTRIBUTION.md) guide!
