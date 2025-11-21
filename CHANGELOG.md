# Changelog

All notable changes to the Lab System Backend API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.html).

## [1.0.0] - 2025-10-26

### Added
#### Features
- **User Management System**: Complete user lifecycle management with role-based access control
 - User registration with username, email, password, and role assignment
  - Role-based user types: teacher, admin, technical staff
  - Profile management with first name and last name support
  - Soft and hard delete capabilities with restoration option
 - User listing with pagination support

- **Authentication & Authorization**: Secure JWT-based authentication system
  - Login/logout functionality with secure session management
  - JWT access tokens with 15-minute expiry
  - Refresh token system with 7-day expiry using selector/verifier pattern
  - HttpOnly cookie-based token storage
  - Role-based access control (RBAC) with admin, teacher, and technical staff permissions
 - Protected endpoints with authentication middleware
  - Current user information retrieval endpoint

- **Laboratory Management**: Comprehensive laboratory management system
  - Create, read, update, and delete laboratory facilities
 - Laboratory status tracking (active/inactive)
  - Time-in/time-out functionality for laboratory sessions
  - Laboratory listing with pagination support
  - Real-time laboratory availability and occupancy tracking

- **Student Management**: Student data management system
  - Student registration with first name, last name, student ID, section, and course
 - Student lookup by ID and section
  - Student listing with pagination support
 - Student update functionality
  - Soft and hard delete capabilities

- **Teacher Management**: Teacher data and dashboard system
 - Teacher registration with first name, last name, and attendance tracking
  - Teacher listing with pagination support
  - Teacher dashboard with schedule information
  - Current lab session tracking for teachers
  - Laboratory status monitoring with availability information

- **Subject Management**: Academic subject management system
  - Subject creation with subject name and code
  - Subject retrieval by ID
  - Subject update and deletion
 - Subject listing with pagination support

- **Scheduling System**: Laboratory scheduling and planning
  - Schedule creation linking teachers, subjects, laboratories, and sections
  - Time-based scheduling with start and end times
  - Schedule status management (scheduled, active, completed)
  - Schedule retrieval and listing

- **Seating Management**: Laboratory seating arrangement system
 - Seating plan creation with student assignments and seat numbers
  - Equipment status tracking (monitor, mouse, keyboard, cables)
  - Seating history tracking for audit purposes
 - Seat assignment to students for specific schedules

- **Laboratory Activity Logging**: Comprehensive activity tracking
  - Lab session logging with time-in/time-out tracking
 - Activity status management
  - Activity log linking to schedules and seating arrangements
 - Real-time session monitoring

- **Database Management**: Complete database schema with relationships
  - Drizzle ORM schema definition with PostgreSQL support
  - 13 migration files with progressive schema evolution
  - Foreign key relationships between all entities
  - Unique constraints and indexes for performance
  - Refresh token management with security enhancements
  - Soft delete capability with is_deleted flag and deleted_at timestamp

- **API Infrastructure**: Complete REST API with OpenAPI documentation
  - Hono framework-based API with middleware support
  - OpenAPI documentation with Scalar API reference
  - Comprehensive error handling and logging
  - Request validation with Zod schemas
  - Health check endpoint
  - Welcome/Root endpoint

- **Middleware & Utilities**: Supporting infrastructure
  - Authentication middleware with JWT verification
  - Role-based access control middleware
 - Request logging with Pino logger
 - Environment variable validation
  - Error schema creation
  - ID parameter validation
  - JSON content type handling
  - Custom error handling

#### Database Schema Changes
- **Migration 0000**: Initial user table with email, password, first_name, last_name, user_type
- **Migration 001**: Teachers table with user_id foreign key and attendance tracking
- **Migration 002**: User table restructuring - added username field, removed first_name/last_name, added username uniqueness constraint
- **Migration 0003**: Added admins and technical_staff tables with user_id foreign keys; added laboratory table with status tracking
- **Migration 0004**: Added lab_activity_log, schedule, seating_history, seating_plan, students, and subjects tables with comprehensive relationships
- **Migration 005**: Renamed equipment status fields in seating_plan table; made first/last name optional for role profiles; added course field to students
- **Migration 006**: Added soft delete capability with is_deleted flag and deleted_at timestamp to users table
- **Migration 0007**: Added refresh_tokens table for secure token management with user_id foreign key
- **Migration 0008**: Fixed typo in refresh_tokens table (token_has → token_hash)
- **Migration 009**: Enhanced refresh_tokens with selector column for O(1) lookups, added indexes, and unique constraints
- **Migration 0010-0012**: Minor schema refinements and optimizations

#### API Endpoints
- **Authentication Endpoints**:
  - `POST /auth/login` - User login with credentials
  - `POST /auth/refresh` - Token refresh using refresh token
  - `GET /auth/me` - Get current user information (requires authentication)
  - `POST /auth/logout` - User logout and session invalidation

- **User Management Endpoints**:
 - `POST /users` - Create new user (admin only)
  - `GET /users` - List users (admin only)
  - `GET /users/all` - Get all users (admin only)
  - `GET /users/:id` - Get specific user (admin, teacher, technical staff)
 - `PUT /users/:id` - Update user (admin only)
 - `DELETE /users/:id` - Soft delete user (admin only)
  - `DELETE /users/:id/hard` - Hard delete user (admin only)
  - `POST /users/:id/restore` - Restore soft-deleted user (admin only)

- **Laboratory Management Endpoints**:
  - `GET /laboratories` - List laboratories with pagination
  - `GET /laboratories/:id` - Get specific laboratory
 - `POST /laboratories` - Create new laboratory
  - `PUT /laboratories/:id` - Update laboratory
 - `DELETE /laboratories/:id` - Delete laboratory

- **Student Management Endpoints**:
  - `GET /students` - List students with pagination
  - `GET /students/:id` - Get specific student
  - `POST /students` - Create new student
  - `PUT /students/:id` - Update student
  - `DELETE /students/:id` - Soft delete student
  - `DELETE /students/:id/hard` - Hard delete student
  - `POST /students/:id/restore` - Restore soft-deleted student

- **Subject Management Endpoints**:
  - `GET /subjects` - List subjects with pagination
  - `GET /subjects/:id` - Get specific subject
  - `POST /subjects` - Create new subject
  - `PUT /subjects/:id` - Update subject
 - `DELETE /subjects/:id` - Delete subject

- **Teacher Management Endpoints**:
 - `GET /teachers` - List teachers with pagination
  - `GET /teachers/:id` - Get specific teacher
  - `GET /teachers/:id/dashboard` - Get teacher dashboard with schedules
  - `GET /teachers/:id/laboratories` - Get laboratories assigned to teacher

- **System Endpoints**:
  - `GET /` - API welcome message
  - `GET /health` - Health check endpoint

#### Services
- **AuthService**: Handles authentication, token management, and session control
  - User authentication with username/password verification
  - JWT access token generation with 15-minute expiry
  - Refresh token management with 7-day expiry using secure selector/verifier pattern
  - Session invalidation and cleanup
 - Secure password verification with bcrypt

- **UserService**: Core business logic for user management
  - User creation with role-specific profile generation
  - User updates with password hashing and role management
 - User retrieval with role-specific data inclusion
  - User listing with pagination support
  - Soft and hard delete with transaction safety
  - User restoration functionality

- **LaboratoryService**: Laboratory data management
  - Laboratory creation, retrieval, update, and deletion
  - Laboratory listing with pagination support
  - Laboratory status management

- **StudentService**: Student data management
 - Student creation, retrieval, and updates
 - Student listing with pagination support
  - Section-based student filtering
 - Soft and hard delete with restoration option

- **SubjectService**: Academic subject management
 - Subject creation, retrieval, and updates
 - Subject listing with pagination support
  - Subject deletion functionality

- **TeacherService**: Teacher data and dashboard management
  - Teacher listing with pagination support
  - Teacher dashboard with schedule and activity information
  - Laboratory status monitoring with availability tracking

#### Security Features
- **JWT Authentication**: Secure access token system with 15-minute expiry
- **Refresh Token System**: Secure refresh tokens with selector/verifier pattern for O(1) lookups
- **Password Security**: Bcrypt password hashing with configurable cost factor
- **Role-Based Access Control**: Fine-grained permissions for admin, teacher, and technical staff roles
- **Session Management**: Secure session invalidation and cleanup
- **Input Validation**: Comprehensive request validation using Zod schemas
- **SQL Injection Prevention**: Parameterized queries using Drizzle ORM

#### Technical Infrastructure
- **Cloudflare Workers**: Deployed as Cloudflare Worker for global edge distribution
- **Neon Database**: Serverless PostgreSQL database with Drizzle ORM
- **Hono Framework**: Fast and lightweight web framework for Cloudflare Workers
- **OpenAPI Documentation**: Auto-generated API documentation with Scalar reference
- **Zod Validation**: Runtime validation with TypeScript integration
- **Pino Logging**: Structured logging with pretty printing support
- **Drizzle ORM**: Type-safe SQL toolkit with PostgreSQL support
- **Bcrypt**: Secure password hashing library
- **Vitest**: Testing framework with Cloudflare Workers support

### Changed
- User table schema evolved from storing first_name/last_name directly to storing in role-specific tables
- Refresh token system enhanced with selector/verifier pattern for improved security and performance
- Authentication system upgraded to use HttpOnly cookies for secure token storage
- Database schema refined with proper foreign key relationships and constraints
- API endpoints organized into role-based access patterns

### Fixed
- Multiple database schema migrations to fix typos and improve performance
- Token security improvements in refresh token implementation
- Foreign key constraint issues in various migration files
- Unique constraint violations and index optimizations

### Security
- Implemented secure refresh token pattern with selector/verifier system
- Password hashing with bcrypt for secure credential storage
- Role-based access control to prevent unauthorized access
- HttpOnly cookie usage to prevent XSS token theft
- Input validation to prevent injection attacks