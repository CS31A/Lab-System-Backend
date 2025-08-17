import type { Context } from 'hono'
import type { CreateUserData } from '@/services/UserService'

import { beforeEach, describe, expect, it, vi } from 'vitest'
// Import after mocks so the SUT picks them up
import { UserService } from '@/services/UserService'

// Capture values passed into db.insert(...).values(...)
let capturedInsertValues: any = null

const mockCreatedUserId = 'user_abc123'

// Mock createDb to avoid real database calls
vi.mock('@/db', () => {
  const insertFn = vi.fn(() => ({
    values: vi.fn((vals: any) => {
      capturedInsertValues = vals
      return {
        // Simulate returning the created user row
        returning: vi.fn(async () => [
          {
            id: mockCreatedUserId,
            // echo back values like drizzle returning would
            ...vals,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]),
      }
    }),
  }))

  const deleteFn = vi.fn(() => ({
    where: vi.fn(async () => void 0),
  }))

  // Minimal surface required by the service in these tests
  const fakeDb = {
    insert: insertFn,
    delete: deleteFn,
  }

  return {
    createDb: vi.fn(() => fakeDb),
  }
})

// Mock bcrypt to make hashing deterministic and fast
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => 'hashedPW'),
  },
}))

function createFakeContext(): Context {
  // Only fields used by the service are provided
  return {
    env: { DATABASE_URL: 'postgres://test-url' },
    var: { logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } },
  } as unknown as Context
}

beforeEach(() => {
  capturedInsertValues = null
  vi.clearAllMocks()
})

describe('userService.createUser', () => {
  it('creates user and role when role is required and profile is created', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)

    const userData: CreateUserData = {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Secret123',
      user_type: 'teacher',
      firstname: 'John',
      lastname: 'Doe',
    }

    const roleRecord = { id: 'role_1', user_id: mockCreatedUserId }
    const createProfileSpy = vi
      .spyOn(service, 'createUserProfile')
      .mockResolvedValue(roleRecord as any)

    const result = await service.createUser(userData)

    // Ensures password was hashed before insert
    expect(capturedInsertValues?.password).toBe('hashedPW')
    expect(capturedInsertValues?.username).toBe(userData.username)
    expect(capturedInsertValues?.email).toBe(userData.email)
    expect(capturedInsertValues?.user_type).toBe(userData.user_type)

    // Ensures role profile creation was invoked with created user id
    expect(createProfileSpy).toHaveBeenCalledWith(mockCreatedUserId, userData)

    // Result shape
    expect(result.user.id).toBe(mockCreatedUserId)
    expect(result.roleRecord).toEqual(roleRecord)

    // Logged success
    expect((ctx.var.logger.info as any)).toHaveBeenCalled()
  })

  it('handles null firstname and lastname correctly', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)

    const userData: CreateUserData = {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Secret123',
      user_type: 'teacher',
      firstname: null,
      lastname: null,
    }

    const roleRecord = { id: 'role_1', user_id: mockCreatedUserId }
    const createProfileSpy = vi
      .spyOn(service, 'createUserProfile')
      .mockResolvedValue(roleRecord as any)

    const result = await service.createUser(userData)

    // Verify null values are passed correctly to createUserProfile
    expect(createProfileSpy).toHaveBeenCalledWith(mockCreatedUserId, userData)
    expect(result.user.id).toBe(mockCreatedUserId)
    expect(result.roleRecord).toEqual(roleRecord)
  })

  it('handles undefined firstname and lastname correctly', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)

    const userData: CreateUserData = {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Secret123',
      user_type: 'teacher',
      // firstname and lastname are undefined (not provided)
    }

    const roleRecord = { id: 'role_1', user_id: mockCreatedUserId }
    const createProfileSpy = vi
      .spyOn(service, 'createUserProfile')
      .mockResolvedValue(roleRecord as any)

    const result = await service.createUser(userData)

    // Verify undefined values are handled correctly
    expect(createProfileSpy).toHaveBeenCalledWith(mockCreatedUserId, userData)
    expect(result.user.id).toBe(mockCreatedUserId)
    expect(result.roleRecord).toEqual(roleRecord)
  })

  it('cleans up and throws when role is required but profile creation returns null', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)

    const userData: CreateUserData = {
      username: 'janedoe',
      email: 'jane@example.com',
      password: 'Secret123',
      user_type: 'teacher', // requires role
    }

    vi.spyOn(service, 'createUserProfile').mockResolvedValue(null)
    const cleanupSpy = vi.spyOn<any, any>(service as any, 'cleanupUser').mockResolvedValue(void 0)

    await expect(service.createUser(userData)).rejects.toThrow('Role creation silently failed')

    // Ensure cleanup was attempted on the created user id
    expect(cleanupSpy).toHaveBeenCalledWith(mockCreatedUserId)

    // Logged error
    expect((ctx.var.logger.error as any)).toHaveBeenCalled()
  })

  it('creates only user (no role) when role is not required', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)

    const userData: CreateUserData = {
      username: 'guestuser',
      email: 'guest@example.com',
      password: 'Secret123',
      user_type: 'guest', // not in required roles list
    }

    vi.spyOn(service, 'createUserProfile').mockResolvedValue(null)

    const result = await service.createUser(userData)

    expect(result.user.id).toBe(mockCreatedUserId)
    expect(result.roleRecord).toBeNull()

    // Should log info, not error
    expect((ctx.var.logger.info as any)).toHaveBeenCalled()
    expect((ctx.var.logger.error as any)).not.toHaveBeenCalled()
  })
})
