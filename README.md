# Lab System Backend

A modern, type-safe REST API for laboratory management built with Hono.js, TypeScript, and Cloudflare Workers. This system manages laboratory schedules, equipment tracking, user roles, and seating arrangements for educational institutions.

## Quick Start

This project uses **Bun** as the package manager instead of npm.

### Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or later)
- PostgreSQL database (local or cloud-hosted)

### Installation

```bash
bun install
```

### Environment Setup

1. Copy environment files:

   ```bash
   cp .env.example .env
   cp .dev.vars.example .dev.vars
   ```

2. Configure your database connection in both files:
   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/lab_system_db
   ```

### Development

```bash
bun run dev
```

The API will be available at `http://localhost:8787`

### API Documentation

- **Interactive Documentation**: `http://localhost:8787/reference`
- **OpenAPI Specification**: `http://localhost:8787/docs`

## Tech Stack

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) with Node.js compatibility
- **Framework**: [Hono.js](https://hono.dev/) with OpenAPI integration
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/) schemas
- **Authentication**: bcryptjs for password hashing
- **Logging**: [Pino](https://getpino.io/) structured logging
- **Package Manager**: [Bun](https://bun.sh/)

## Features

- User Management - Role-based access (teachers, technical staff, admins)
- Laboratory Management - Lab room scheduling and status tracking
- Equipment Tracking - Monitor, keyboard, mouse, and cable status
- Seating Plans - Student seat assignments with equipment conditions
- Activity Logging - Session tracking and historical records
- OpenAPI Documentation - Auto-generated interactive API docs
- Type Safety - Full TypeScript support with Zod validation
- Pagination - Built-in pagination for list endpoints
- Error Handling - Comprehensive error handling and logging

## Database Schema

The system manages these core entities:

- **Users** - Authentication and role management
- **Teachers/Staff/Admins** - Role-specific user profiles
- **Students** - Student information and enrollment data
- **Laboratories** - Physical lab rooms and their status
- **Subjects** - Course subjects and codes
- **Schedules** - Lab session scheduling
- **Seating Plans** - Equipment assignments and tracking
- **Activity Logs** - Session history and equipment status

## Available Scripts

| Script              | Command              | Description                                       |
| ------------------- | -------------------- | ------------------------------------------------- |
| **Development**     | `bun run dev`        | Start development server with hot reload          |
| **Build & Deploy**  | `bun run deploy`     | Deploy to Cloudflare Workers                      |
| **Type Generation** | `bun run cf-typegen` | Generate TypeScript types for Cloudflare bindings |
| **Linting**         | `bun run lint`       | Run ESLint code quality checks                    |
| **Lint Fix**        | `bun run lint:fix`   | Automatically fix linting issues                  |

## API Endpoints

### Core Endpoints

- `GET /` - API welcome message
- `GET /health` - Health check endpoint

### User Management

- `POST /users` - Create new user account

### Teacher Management

- `GET /teachers` - List teachers with pagination

_More endpoints are available - check the [interactive documentation](http://localhost:8787/reference) when running the development server._

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

This project uses **Vitest** for unit testing. See [CONTRIBUTION.md](./CONTRIBUTION.md#testing) for detailed testing guidelines.

```bash
# Run tests
bun run test

# Run tests with UI
bun run test:ui

# Run tests once
bun run test:run
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
