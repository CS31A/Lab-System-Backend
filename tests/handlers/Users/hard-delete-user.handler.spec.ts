import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HardDeleteUserHandler } from '@/handlers/users/hard-delete-user.handler'
import { UserService } from '@/services/UserService'

// Mock the UserService
vi.mock('@/services/UserService', () => {
  return {
    UserService: vi.fn().mockImplementation(() => {
      return {
        hardDeleteUser: vi.fn(),
      }
    }),
  }
})

function createMockContext(params: any = {}): Context {
  const mockContext: any = {
    req: {
      valid: vi.fn(() => params),
    },
    json: vi.fn((data, status) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
    var: {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    },
  }
  return mockContext as unknown as Context
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('hardDeleteUserHandler', () => {
  it('should successfully delete a user and return 200 status', async () => {
    const mockContext = createMockContext({ id: 'user123' }) // I'm the mock, i'm the mock, i'm the mock, i'm the mock, I'M THE MOCKK (Map)

    // Mock the UserService hardDeleteUser method to return a user
    const mockDeletedUser = {
      id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword',
      user_type: 'teacher',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const mockUserService = new UserService(mockContext)
    mockUserService.hardDeleteUser = vi.fn().mockResolvedValue(mockDeletedUser)

    // Mock the UserService constructor to return our mock
    ;(UserService as any).mockImplementation(() => mockUserService)

    const handler = HardDeleteUserHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    // Verify the UserService was called with the correct user ID
    expect(mockUserService.hardDeleteUser).toHaveBeenCalledWith('user123')

    // Verify the response
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'User permanently deleted successfully',
      },
      200,
    )

    // Verify logger was called
    expect(mockContext.var.logger.info).toHaveBeenCalled()
  })

  it('should return 404 when user is not found', async () => {
    const mockContext = createMockContext({ id: 'user123' })

    // Mock the UserService hardDeleteUser method to throw an error
    const mockUserService = new UserService(mockContext)
    mockUserService.hardDeleteUser = vi.fn().mockRejectedValue(new Error('User not found'))

    // Mock the UserService constructor to return our mock
    ;(UserService as any).mockImplementation(() => mockUserService)

    const handler = HardDeleteUserHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    // Verify the response
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'User not found',
      },
      404,
    )

    // Verify logger was called
    expect(mockContext.var.logger.warn).toHaveBeenCalled()
  })

  it('should return 500 when an unexpected error occurs', async () => {
    const mockContext = createMockContext({ id: 'user123' })

    // Mock the UserService hardDeleteUser method to throw an unexpected error
    const mockUserService = new UserService(mockContext)
    mockUserService.hardDeleteUser = vi.fn().mockRejectedValue(new Error('Database error'))

    // Mock the UserService constructor to return our mock
    ;(UserService as any).mockImplementation(() => mockUserService)

    const handler = HardDeleteUserHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    // Verify the response
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred during user deletion',
      },
      500,
    )

    // Verify logger was called
    expect(mockContext.var.logger.error).toHaveBeenCalled()
  })
})
