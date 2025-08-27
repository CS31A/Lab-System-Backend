import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetUserHandler } from '@/handlers/users/get-user.handler'

// Mock the UserService
const mockGetUserById = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/services/UserService', () => ({
  UserService: vi.fn().mockImplementation(() => ({
    getUserById: mockGetUserById,
  })),
}))

function createMockContext(userId: string, userExists: boolean = true): Context {
  const _mockUserWithRole = userExists
    ? {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        user_type: 'teacher',
        password: 'hashedPassword',
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
        teacher: {
          id: 'teacher_123',
          user_id: userId,
          firstname: 'Test',
          lastname: 'User',
          attendance: 'present',
          created_at: new Date(),
          updated_at: new Date(),
        },
      }
    : null

  return {
    req: {
      valid: vi.fn().mockReturnValue({ id: userId }),
    },
    var: {
      logger: mockLogger,
    },
    json: vi.fn().mockImplementation((data, status) => ({
      json: () => Promise.resolve(data),
      status,
    })),
  } as unknown as Context
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getUserHandler', () => {
  it('successfully retrieves a user with role data', async () => {
    const userId = 'user_123'
    const mockUserWithRole = {
      id: userId,
      email: 'test@example.com',
      username: 'testuser',
      user_type: 'teacher',
      password: 'hashedPassword',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
      teacher: {
        id: 'teacher_123',
        user_id: userId,
        firstname: 'Test',
        lastname: 'User',
        attendance: 'present',
        created_at: new Date(),
        updated_at: new Date(),
      },
    }

    mockGetUserById.mockResolvedValue(mockUserWithRole)

    const ctx = createMockContext(userId)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = GetUserHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    // Verify UserService.getUserById was called with the correct ID
    expect(mockGetUserById).toHaveBeenCalledWith(userId)

    // Verify response structure
    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: `User of Id ${userId} is successfully retrieved`,
        data: {
          id: userId,
          email: 'test@example.com',
          username: 'testuser',
          user_type: 'teacher',
          is_deleted: false,
          created_at: mockUserWithRole.created_at,
          updated_at: mockUserWithRole.updated_at,
          teacher: {
            id: 'teacher_123',
            user_id: userId,
            firstname: 'Test',
            lastname: 'User',
            attendance: 'present',
            created_at: expect.any(Date),
            updated_at: expect.any(Date),
          },
          // password should be excluded
        },
      },
      200,
    )
  })

  it('returns 404 when user is not found', async () => {
    const userId = 'nonexistent123'
    mockGetUserById.mockResolvedValue(null)

    const ctx = createMockContext(userId, false)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = GetUserHandler as unknown as (c: Context) => Promise<Response>
    await handler(ctx)

    // Verify UserService.getUserById was called with the correct ID
    expect(mockGetUserById).toHaveBeenCalledWith(userId)

    // Verify 404 response
    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'User not found',
      },
      404,
    )

    // Verify no warning was logged (since this is not an error case)
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('handles service errors correctly', async () => {
    const userId = 'user_123'
    mockGetUserById.mockRejectedValue(new Error('Database connection failed'))

    const ctx = createMockContext(userId)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = GetUserHandler as unknown as (c: Context) => Promise<Response>
    await handler(ctx)

    // Verify error logging
    expect(mockLogger.error).toHaveBeenCalledWith('User retrieval failed', {
      error: 'Database connection failed',
      user_id: userId,
      timestamp: expect.any(String),
    })

    // Verify error response
    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred while retrieving the user',
      },
      500,
    )
  })

  it('handles specific "User not found" error', async () => {
    const userId = 'user_123'
    mockGetUserById.mockRejectedValue(new Error('User not found'))

    const ctx = createMockContext(userId)
    // Cast to a simpler function type to avoid TypeScript errors
    const handler = GetUserHandler as unknown as (c: Context) => Promise<Response>
    await handler(ctx)

    // Verify warning logging
    expect(mockLogger.warn).toHaveBeenCalledWith('User retrieval failed - user not found', {
      user_id: userId,
      timestamp: expect.any(String),
    })

    // Verify 404 response
    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'User not found',
      },
      404,
    )
  })
})
