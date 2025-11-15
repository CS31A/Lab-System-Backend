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

    // Set insert values (for sharing state with transaction)
    setLastInsertValues: (vals: any) => {
      insertValues = vals
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

    // Mock delete chain: db.delete(table).where(condition).returning()
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => selectResults),
      })),
    })),
  }

  return mockDb
}

// Create mock serverless database with transaction support
function createMockServerlessDb() {
  const mockDb = createMockDb()

  return {
    ...mockDb,
    // Mock transaction method that executes the callback with the mock db
    transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
      // Create a transaction mock that shares the same state as the main mock
      const txMock = {
        ...mockDb,
        // Override insert to use the same tracking mechanism
        insert: vi.fn(() => ({
          values: vi.fn((vals: any) => {
            // Store values in the main mock for tracking
            mockDb.setLastInsertValues(vals)
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
      }

      // Execute the callback with the transaction mock
      return await callback(txMock)
    }),
  }
}

// Mock the createDb and createServerlessDb functions
vi.mock('@/db', () => ({
  createDb: vi.fn(() => createMockDb()),
  createServerlessDb: vi.fn(() => createMockServerlessDb()),
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

// Helper to get the mock serverless database instance
function getMockServerlessDb(service: UserService): ReturnType<typeof createMockServerlessDb> {
  return (service as any).serverlessDb
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('userService.createUser', () => {
  it('creates user and role when role is required and profile is created', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockServerlessDb = getMockServerlessDb(service)

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
      .spyOn(service as any, 'createUserProfileInTransaction')
      .mockResolvedValue(roleRecord as any)

    const result = await service.createUser(userData)

    // Verify transaction was called
    expect(mockServerlessDb.transaction).toHaveBeenCalled()

    // Ensures role profile creation was invoked with transaction, user id, and userData
    expect(createProfileSpy).toHaveBeenCalledWith(expect.anything(), mockCreatedUserId, userData)

    // Result shape
    expect(result.user.id).toBe(mockCreatedUserId)
    expect(result.user.username).toBe(userData.username)
    expect(result.user.email).toBe(userData.email)
    expect(result.user.user_type).toBe(userData.user_type)
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
      .spyOn(service as any, 'createUserProfileInTransaction')
      .mockResolvedValue(roleRecord as any)

    const result = await service.createUser(userData)

    // Verify null values are passed correctly to createUserProfileInTransaction
    expect(createProfileSpy).toHaveBeenCalledWith(expect.anything(), mockCreatedUserId, userData)
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
      .spyOn(service as any, 'createUserProfileInTransaction')
      .mockResolvedValue(roleRecord as any)

    const result = await service.createUser(userData)

    // Verify undefined values are handled correctly
    expect(createProfileSpy).toHaveBeenCalledWith(expect.anything(), mockCreatedUserId, userData)
    expect(result.user.id).toBe(mockCreatedUserId)
    expect(result.roleRecord).toEqual(roleRecord)
  })

  it('throws and rolls back transaction when role is required but profile creation returns null', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockServerlessDb = getMockServerlessDb(service)

    const userData: CreateUserData = {
      username: 'janedoe',
      email: 'jane@example.com',
      password: 'Secret123',
      user_type: 'teacher', // requires role
    }

    vi.spyOn(service as any, 'createUserProfileInTransaction').mockResolvedValue(null)

    await expect(service.createUser(userData)).rejects.toThrow('Role creation silently failed')

    // Verify transaction was called (and would have rolled back automatically)
    expect(mockServerlessDb.transaction).toHaveBeenCalled()

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

    vi.spyOn(service as any, 'createUserProfileInTransaction').mockResolvedValue(null)

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

describe('userService.hardDeleteUser', () => {
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

  it('successfully deletes a user and their role profile', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockServerlessDb = getMockServerlessDb(service)
    const mockDb = getMockDb(service)

    // Mock getUserById to return the user
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
              limit: vi.fn(() => []),
            })),
          })),
        }
      }
    }) as any

    // Mock the transaction to return the deleted user and record delete sequence
    const deleteSequence: any[] = []
    mockServerlessDb.transaction = vi.fn(async (callback: (tx: any) => Promise<any>) => {
      const txMock = {
        delete: vi.fn((table: any) => ({
          where: vi.fn((cond: any) => {
            deleteSequence.push({ table, cond })
            return {
              // Return the user row only when deleting from users; empty for role tables
              returning: vi.fn(async () => (table === users ? [mockUser] : [])),
            }
          }),
        })),
      }
      return await callback(txMock)
    })

    const result = await service.hardDeleteUser('user123')

    // Verify transaction was called
    expect(mockServerlessDb.transaction).toHaveBeenCalled()

    // Verify the result
    expect(result).toEqual(mockUser)

    // Verify logger was called
    expect(ctx.var.logger.info).toHaveBeenCalled()

    // Verify we deleted role profile first, then the user
    expect(deleteSequence.map(c => c.table)).toEqual([teachers, users])
    expect(deleteSequence.length).toBe(2)
  })

  it('throws an error when user is not found', async () => {
    const ctx = createFakeContext()
    const service = new UserService(ctx)
    const mockDb = getMockDb(service)

    // Mock getUserById to return null (user not found)
    mockDb.setSelectResults([])

    await expect(service.hardDeleteUser('user123')).rejects.toThrow('User not found')

    // Verify logger was called
    expect(ctx.var.logger.error).not.toHaveBeenCalled()
  })
})
