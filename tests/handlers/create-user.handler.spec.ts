import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateUserHandler } from '@/handlers/users/create-user.handler'

interface CreateUserSchemaData {
  username: string
  email: string
  password: string
  confirm_password: string
  user_type: string
  firstname: string | null | undefined
  lastname: string | null | undefined
}

// Mock the UserService
const mockCreateUser = vi.fn()
vi.mock('@/services/UserService', () => ({
  UserService: vi.fn().mockImplementation(() => ({
    createUser: mockCreateUser,
  })),
}))

function createMockContext(validatedData: CreateUserSchemaData): Context {
  return {
    req: {
      valid: vi.fn().mockReturnValue(validatedData),
    },
    var: {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
      },
    },
    json: vi.fn().mockImplementation((data, status) => ({ data, status })),
  } as unknown as Context
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createUserHandler Integration Tests', () => {
  it('successfully creates user with complete schema data including confirm_password', async () => {
    const schemaData: CreateUserSchemaData = {
      username: 'johndoe123',
      email: 'john@example.com',
      password: 'Secret123!',
      confirm_password: 'Secret123!',
      user_type: 'teacher',
      firstname: 'John',
      lastname: 'Doe',
    }

    const mockUser = {
      id: 'user_123',
      username: 'johndoe123',
      email: 'john@example.com',
      password: 'hashedPassword',
      user_type: 'teacher',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const mockRoleRecord = {
      id: 'teacher_123',
      user_id: 'user_123',
      firstname: 'John',
      lastname: 'Doe',
    }

    mockCreateUser.mockResolvedValue({
      user: mockUser,
      roleRecord: mockRoleRecord,
    })

    const ctx = createMockContext(schemaData)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = CreateUserHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    // Verify UserService.createUser was called with transformed data (no confirm_password)
    expect(mockCreateUser).toHaveBeenCalledWith({
      username: 'johndoe123',
      email: 'john@example.com',
      password: 'Secret123!',
      user_type: 'teacher',
      firstname: 'John',
      lastname: 'Doe',
    })

    // Verify response structure
    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'User created successfully with teacher profile',
        data: {
          id: 'user_123',
          username: 'johndoe123',
          email: 'john@example.com',
          user_type: 'teacher',
          is_deleted: false,
          created_at: mockUser.created_at,
          updated_at: mockUser.updated_at,
          // password should be excluded
        },
      },
      201,
    )
  })

  it('handles optional firstname/lastname correctly (undefined to null transformation)', async () => {
    const schemaData: CreateUserSchemaData = {
      username: 'janedoe123',
      email: 'jane@example.com',
      password: 'Secret123!',
      confirm_password: 'Secret123!',
      user_type: 'admin',
      firstname: undefined,
      lastname: undefined,
      // firstname and lastname are explicitly undefined
    }

    const mockUser = {
      id: 'user_456',
      username: 'janedoe123',
      email: 'jane@example.com',
      password: 'hashedPassword',
      user_type: 'admin',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockCreateUser.mockResolvedValue({
      user: mockUser,
      roleRecord: { id: 'admin_456', user_id: 'user_456' },
    })

    const ctx = createMockContext(schemaData)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = CreateUserHandler as unknown as (c: Context) => Promise<Response>
    await handler(ctx)

    // Verify transformation: undefined -> null
    expect(mockCreateUser).toHaveBeenCalledWith({
      username: 'janedoe123',
      email: 'jane@example.com',
      password: 'Secret123!',
      user_type: 'admin',
      firstname: null,
      lastname: null,
    })
  })

  it('handles empty string firstname/lastname correctly (empty string to null transformation)', async () => {
    const schemaData: CreateUserSchemaData = {
      username: 'bobsmith123',
      email: 'bob@example.com',
      password: 'Secret123!',
      confirm_password: 'Secret123!',
      user_type: 'technical_staff',
      firstname: '',
      lastname: '',
    }

    const mockUser = {
      id: 'user_789',
      username: 'bobsmith123',
      email: 'bob@example.com',
      password: 'hashedPassword',
      user_type: 'technical_staff',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockCreateUser.mockResolvedValue({
      user: mockUser,
      roleRecord: { id: 'staff_789', user_id: 'user_789' },
    })

    const ctx = createMockContext(schemaData)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = CreateUserHandler as unknown as (c: Context) => Promise<Response>
    await handler(ctx)

    // Verify transformation: empty string -> null
    expect(mockCreateUser).toHaveBeenCalledWith({
      username: 'bobsmith123',
      email: 'bob@example.com',
      password: 'Secret123!',
      user_type: 'technical_staff',
      firstname: null,
      lastname: null,
    })
  })

  it('handles service errors correctly', async () => {
    const schemaData: CreateUserSchemaData = {
      username: 'erroruser',
      email: 'error@example.com',
      password: 'Secret123!',
      confirm_password: 'Secret123!',
      user_type: 'teacher',
      firstname: undefined,
      lastname: undefined,
    }

    mockCreateUser.mockRejectedValue(new Error('Database connection failed'))

    const ctx = createMockContext(schemaData)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = CreateUserHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    // Verify error logging
    expect(ctx.var.logger.error).toHaveBeenCalledWith('User creation failed', {
      error: 'Database connection failed',
      email: 'error@example.com',
      user_type: 'teacher',
      timestamp: expect.any(String),
    })

    // Verify error response
    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred during user creation',
      },
      500,
    )
  })

  it('creates user without role when user_type does not require role', async () => {
    const schemaData: CreateUserSchemaData = {
      username: 'guestuser123',
      email: 'guest@example.com',
      password: 'Secret123!',
      confirm_password: 'Secret123!',
      user_type: 'guest',
      firstname: undefined,
      lastname: undefined,
    }

    const mockUser = {
      id: 'user_guest',
      username: 'guestuser123',
      email: 'guest@example.com',
      password: 'hashedPassword',
      user_type: 'guest',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockCreateUser.mockResolvedValue({
      user: mockUser,
      roleRecord: null, // No role for guest users
    })

    const ctx = createMockContext(schemaData)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = CreateUserHandler as unknown as (c: Context) => Promise<Response>
    await handler(ctx)

    // Verify response message doesn't mention role
    expect(ctx.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'User created successfully',
      }),
      201,
    )
  })
})
