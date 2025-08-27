/* eslint-disable unused-imports/no-unused-imports */
import type { Context } from 'hono'
import type { CreateUserData, UserWithRole } from '@/services/UserService'

import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { admins, teachers, technical_staff, users } from '@/db/schema'
// Import after mocks so the SUT picks them up
import { UserService } from '@/services/UserService'

// Test data constants
const mockCreatedUserId = 'user_abc123'
const mockCreatedAt = new Date('2024-01-01T00:00:00Z')
const mockUpdatedAt = new Date('2024-01-01T00:00:00Z')

// Simplified database mock that matches Drizzle's API
function createMockDb() {
  let insertValues: any = null
  let selectResults: any[] = []

  const mockDb = {
    // Track what was inserted for assertions
    getLastInsertValues: () => insertValues,

    // Set what select queries should return
    setSelectResults: (results: any[]) => {
      selectResults = results
    },

    // Mock insert chain: db.insert(table).values(data).returning()
    insert: vi.fn(() => ({
      values: vi.fn((vals: any) => {
        insertValues = vals
        return {
          returning: vi.fn(async () => [
            {
              id: mockCreatedUserId,
              ...vals,
              is_deleted: false,
              created_at: mockCreatedAt,
              updated_at: mockUpdatedAt,
            },
          ]),
        }
      }),
    })),

    // Mock select chain: db.select().from(table).where(condition).limit(n)
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn((_condition: any) => ({
          limit: vi.fn(() => {
            // Simple logic to filter deleted users for getUserById tests
            if (selectResults.length > 0 && selectResults[0].is_deleted === true) {
              return [] // Return empty array if user is deleted
            }
            return selectResults
          }),
        })),
      })),
    })),

    // Mock update chain: db.update(table).set(data).where(condition).returning()
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => selectResults),
        })),
      })),
    })),

    // Mock delete chain: db.delete(table).where(condition)
    delete: vi.fn(() => ({
      where: vi.fn(async () => void 0),
    })),
  }

  return mockDb
}

// Mock the createDb function
vi.mock('@/db', () => ({
  createDb: vi.fn(() => createMockDb()),
}))

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

// Helper to get a fresh mock database instance
function getMockDb(service: UserService): ReturnType<typeof createMockDb> {
  return (service as any).db
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('userService.createUser', () => {
  it('creates user and role when role is required and profile is created', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockDb = getMockDb(service)

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

    // Verify the correct data was inserted
    const insertedValues = mockDb.getLastInsertValues()
    expect(insertedValues.password).toBe('hashedPW')
    expect(insertedValues.username).toBe(userData.username)
    expect(insertedValues.email).toBe(userData.email)
    expect(insertedValues.user_type).toBe(userData.user_type)

    // Ensures role profile creation was invoked with created user id
    expect(createProfileSpy).toHaveBeenCalledWith(mockCreatedUserId, userData)

    // Result shape
    expect(result.user.id).toBe(mockCreatedUserId)
    expect(result.roleRecord).toEqual(roleRecord)

    // Logged success
    expect(ctx.var.logger.info).toHaveBeenCalled()
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
    expect(ctx.var.logger.error).toHaveBeenCalled()
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
    expect(ctx.var.logger.info).toHaveBeenCalled()
    expect(ctx.var.logger.error).not.toHaveBeenCalled()
  })
})

describe('userService.getUserById', () => {
  // Mock data for testing getUserById
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
    user_type: 'teacher',
    password: 'hashedPassword',
    is_deleted: false,
    created_at: mockCreatedAt,
    updated_at: mockUpdatedAt,
  }

  const mockTeacherProfile = {
    id: 'teacher123',
    user_id: 'user123',
    firstname: 'John',
    lastname: 'Doe',
    attendance: 'present',
    created_at: mockCreatedAt,
    updated_at: mockUpdatedAt,
  }

  const mockAdminProfile = {
    id: 'admin123',
    user_id: 'user123',
    firstname: 'Jane',
    lastname: 'Smith',
    created_at: mockCreatedAt,
    updated_at: mockUpdatedAt,
  }

  const mockTechnicalStaffProfile = {
    id: 'staff123',
    user_id: 'user123',
    firstname: 'Bob',
    lastname: 'Johnson',
    created_at: mockCreatedAt,
    updated_at: mockUpdatedAt,
  }

  it('returns user with teacher profile when user_type is teacher', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockDb = getMockDb(service)

    // First call returns the user, second call returns the teacher profile
    mockDb.setSelectResults([mockUser])

    // Mock the second select call for teacher profile
    const originalSelect = mockDb.select
    let callCount = 0
    mockDb.select = vi.fn(() => {
      callCount++
      if (callCount === 1) {
        // First call for user
        return originalSelect()
      }
      else {
        // Second call for teacher profile
        return {
          from: vi.fn(() => ({
            where: vi.fn((_condition: any) => ({
              limit: vi.fn(() => [mockTeacherProfile]),
            })),
          })),
        }
      }
    }) as any

    const result = await service.getUserById('user123')

    expect(result).toEqual({
      ...mockUser,
      teacher: mockTeacherProfile,
    })
  })

  it('returns user with admin profile when user_type is admin', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockDb = getMockDb(service)

    // Mock user with admin type
    const mockAdminUser = { ...mockUser, user_type: 'admin' }

    // Setup mock for user query
    mockDb.setSelectResults([mockAdminUser])

    // Mock the second select call for admin profile
    const originalSelect = mockDb.select
    let callCount = 0
    mockDb.select = vi.fn(() => {
      callCount++
      if (callCount === 1) {
        return originalSelect()
      }
      else {
        return {
          from: vi.fn(() => ({
            where: vi.fn((_condition: any) => ({
              limit: vi.fn(() => [mockAdminProfile]),
            })),
          })),
        }
      }
    }) as any

    const result = await service.getUserById('user123')

    expect(result).toEqual({
      ...mockAdminUser,
      admin: mockAdminProfile,
    })
  })

  it('returns user with technical_staff profile when user_type is technical_staff', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockDb = getMockDb(service)

    // Mock user with technical_staff type
    const mockStaffUser = { ...mockUser, user_type: 'technical_staff' }

    // Setup mock for user query
    mockDb.setSelectResults([mockStaffUser])

    // Mock the second select call for technical_staff profile
    const originalSelect = mockDb.select
    let callCount = 0
    mockDb.select = vi.fn(() => {
      callCount++
      if (callCount === 1) {
        return originalSelect()
      }
      else {
        return {
          from: vi.fn(() => ({
            where: vi.fn((_condition: any) => ({
              limit: vi.fn(() => [mockTechnicalStaffProfile]),
            })),
          })),
        }
      }
    }) as any

    const result = await service.getUserById('user123')

    expect(result).toEqual({
      ...mockStaffUser,
      technical_staff: mockTechnicalStaffProfile,
    })
  })

  it('returns user without profile when user_type is unknown', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockDb = getMockDb(service)

    // Mock user with unknown type
    const mockUnknownUser = { ...mockUser, user_type: 'unknown' }

    // Setup mock to return unknown user type
    mockDb.setSelectResults([mockUnknownUser])

    const result = await service.getUserById('user123')

    expect(result).toEqual(mockUnknownUser)
  })

  it('returns null when user is not found', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockDb = getMockDb(service)

    // Setup mock to return empty array (no user found)
    mockDb.setSelectResults([])

    const result = await service.getUserById('user123')

    expect(result).toBeNull()
  })

  it('returns null when user is deleted', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockDb = getMockDb(service)

    // Mock deleted user
    const mockDeletedUser = { ...mockUser, is_deleted: true }

    // Setup mock to return deleted user
    mockDb.setSelectResults([mockDeletedUser])

    const result = await service.getUserById('user123')

    // Should return null because the user is deleted
    expect(result).toBeNull()
  })
})
