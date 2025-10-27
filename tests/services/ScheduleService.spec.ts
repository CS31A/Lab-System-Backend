import type { Context } from 'hono'
import type { CreateScheduleData, UpdateScheduleData } from '@/services/ScheduleService'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScheduleService } from '@/services/ScheduleService'

const mockCreatedAt = new Date('2024-01-01T00:00:00Z')
const mockUpdatedAt = new Date('2024-01-01T00:00:00Z')
const mockScheduleId = 'schedule_abc123'

// Simplified database mock that matches Drizzle's API
function createMockDb() {
  let insertValues: any = null
  let selectResults: any[] = []
  let updateData: any = null
  let deleteResults: any[] = []
  let countValue = 0

  const mockDb = {
    // Track what was inserted for assertions
    getLastInsertValues: () => insertValues,
    getLastUpdateData: () => updateData,

    // Set what select queries should return
    setSelectResults: (results: any[]) => {
      selectResults = results
      countValue = results.length
    },

    // Set count value separately
    setCountValue: (count: number) => {
      countValue = count
    },

    // Set what delete queries should return
    setDeleteResults: (results: any[]) => {
      deleteResults = results
    },

    // Mock insert chain: db.insert(table).values(data).returning()
    insert: vi.fn(() => ({
      values: vi.fn((vals: any) => {
        insertValues = vals
        return {
          returning: vi.fn(async () => [
            {
              id: mockScheduleId,
              ...vals,
              created_at: mockCreatedAt,
              updated_at: mockUpdatedAt,
            },
          ]),
        }
      }),
    })),

    // Mock select chain: db.select().from(table).where(condition).limit(n)
    select: vi.fn((fields?: any) => {
      // Check if this is a count query
      if (fields && typeof fields === 'object' && 'count' in fields) {
        return {
          from: vi.fn(async () => [{ count: countValue }]),
        }
      }
      // Regular select query
      return {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => selectResults),
          })),
          limit: vi.fn(() => ({
            offset: vi.fn(() => ({
              orderBy: vi.fn(async () => selectResults),
            })),
          })),
          orderBy: vi.fn(async () => selectResults),
        })),
      }
    }),

    // Mock update chain: db.update(table).set(data).where(condition).returning()
    update: vi.fn(() => ({
      set: vi.fn((data: any) => {
        updateData = data
        return {
          where: vi.fn(() => ({
            returning: vi.fn(async () => selectResults),
          })),
        }
      }),
    })),

    // Mock delete chain: db.delete(table).where(condition).returning()
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => deleteResults),
      })),
    })),
  }

  return mockDb
}

// Mock serverless db (same as regular db for testing purposes)
function createMockServerlessDb() {
  return createMockDb()
}

// Mock the createDb and createServerlessDb functions
vi.mock('@/db', () => ({
  createDb: vi.fn(() => createMockDb()),
  createServerlessDb: vi.fn(() => createMockServerlessDb()),
}))

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

function createFakeContext(): Context {
  return {
    env: { DATABASE_URL: 'postgres://test-url' },
    var: {
      logger: mockLogger,
    },
  } as unknown as Context
}

// Helper to get a fresh mock database instance
function getMockDb(service: ScheduleService): ReturnType<typeof createMockDb> {
  return (service as any).db
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('scheduleService.createSchedule', () => {
  it('successfully creates a schedule with complete data', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const scheduleData: CreateScheduleData = {
      laboratory_id: 'lab001',
      teacher_id: 'teacher123',
      subject_id: 'subj456',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
      status: 'active',
    }

    const result = await service.createSchedule(scheduleData)

    // Verify insert was called
    expect(mockDb.insert).toHaveBeenCalled()

    // Verify the inserted values
    expect(mockDb.getLastInsertValues()).toEqual(scheduleData)

    // Verify the result
    expect(result.id).toBe(mockScheduleId)
    expect(result.laboratory_id).toBe(scheduleData.laboratory_id)
    expect(result.teacher_id).toBe(scheduleData.teacher_id)
    expect(result.subject_id).toBe(scheduleData.subject_id)
    expect(result.section).toBe(scheduleData.section)
    expect(result.status).toBe(scheduleData.status)

    // Verify logger was called
    expect(mockLogger.info).toHaveBeenCalledWith('Schedule created successfully', {
      scheduleId: mockScheduleId,
      laboratoryId: scheduleData.laboratory_id,
      teacherId: scheduleData.teacher_id,
      subjectId: scheduleData.subject_id,
      section: scheduleData.section,
      timestamp: expect.any(String),
    })
  })

  it('successfully creates a schedule without optional status', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const scheduleData: CreateScheduleData = {
      laboratory_id: 'lab002',
      teacher_id: 'teacher456',
      subject_id: 'subj789',
      section: 'CS102-B',
      start_time: new Date('2025-10-28T13:00:00Z'),
      end_time: new Date('2025-10-28T15:00:00Z'),
    }

    const result = await service.createSchedule(scheduleData)

    expect(result.id).toBe(mockScheduleId)
    expect(mockDb.getLastInsertValues()).toEqual(scheduleData)
    expect(mockLogger.info).toHaveBeenCalled()
  })

  it('handles database errors correctly', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const scheduleData: CreateScheduleData = {
      laboratory_id: 'invalid_lab',
      teacher_id: 'teacher123',
      subject_id: 'subj456',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
    }

    // Mock database error
    mockDb.insert = vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockRejectedValue(new Error('Foreign key constraint violation')),
      })),
    })) as any

    await expect(service.createSchedule(scheduleData)).rejects.toThrow(
      'Foreign key constraint violation',
    )

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to create schedule', {
      error: 'Foreign key constraint violation',
      scheduleData,
      timestamp: expect.any(String),
    })
  })
})

describe('scheduleService.getScheduleById', () => {
  it('successfully retrieves a schedule by ID', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const mockSchedule = {
      id: 'schedule123',
      laboratory_id: 'lab001',
      teacher_id: 'teacher456',
      subject_id: 'subj789',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
      status: 'active',
      created_at: mockCreatedAt,
      updated_at: mockUpdatedAt,
    }

    mockDb.setSelectResults([mockSchedule])

    const result = await service.getScheduleById('schedule123')

    expect(result).toEqual(mockSchedule)
    expect(mockDb.select).toHaveBeenCalled()
  })

  it('returns null when schedule is not found', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    mockDb.setSelectResults([])

    const result = await service.getScheduleById('nonexistent_schedule')

    expect(result).toBeNull()
  })

  it('handles database errors correctly', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    // Mock database error
    mockDb.select = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        })),
      })),
    })) as any

    await expect(service.getScheduleById('schedule123')).rejects.toThrow(
      'Database connection failed',
    )

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to retrieve schedule', {
      error: 'Database connection failed',
      scheduleId: 'schedule123',
      timestamp: expect.any(String),
    })
  })
})

describe('scheduleService.updateSchedule', () => {
  it('successfully updates all schedule fields', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const updateData: UpdateScheduleData = {
      laboratory_id: 'lab002',
      teacher_id: 'teacher789',
      subject_id: 'subj123',
      section: 'CS103-C',
      start_time: new Date('2025-10-29T09:00:00Z'),
      end_time: new Date('2025-10-29T11:00:00Z'),
      status: 'updated',
    }

    const mockUpdatedSchedule = {
      id: 'schedule123',
      ...updateData,
      created_at: mockCreatedAt,
      updated_at: new Date(),
    }

    mockDb.setSelectResults([mockUpdatedSchedule])

    const result = await service.updateSchedule('schedule123', updateData)

    expect(result).toEqual(mockUpdatedSchedule)
    expect(mockDb.update).toHaveBeenCalled()
    expect(mockDb.getLastUpdateData()).toEqual(updateData)

    expect(mockLogger.info).toHaveBeenCalledWith('Schedule updated successfully', {
      scheduleId: 'schedule123',
      updatedFields: Object.keys(updateData),
      timestamp: expect.any(String),
    })
  })

  it('successfully updates only some fields', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const updateData: UpdateScheduleData = {
      section: 'CS104-D',
      status: 'completed',
    }

    const mockUpdatedSchedule = {
      id: 'schedule456',
      laboratory_id: 'lab001',
      teacher_id: 'teacher123',
      subject_id: 'subj456',
      section: 'CS104-D',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
      status: 'completed',
      created_at: mockCreatedAt,
      updated_at: new Date(),
    }

    mockDb.setSelectResults([mockUpdatedSchedule])

    const result = await service.updateSchedule('schedule456', updateData)

    expect(result).toEqual(mockUpdatedSchedule)
    expect(mockDb.getLastUpdateData()).toEqual(updateData)

    expect(mockLogger.info).toHaveBeenCalledWith('Schedule updated successfully', {
      scheduleId: 'schedule456',
      updatedFields: ['section', 'status'],
      timestamp: expect.any(String),
    })
  })

  it('throws error when schedule is not found', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const updateData: UpdateScheduleData = {
      status: 'active',
    }

    mockDb.setSelectResults([])

    await expect(service.updateSchedule('nonexistent_schedule', updateData)).rejects.toThrow(
      'Schedule not found',
    )

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to update schedule', {
      error: 'Schedule not found',
      scheduleId: 'nonexistent_schedule',
      timestamp: expect.any(String),
    })
  })

  it('handles database constraint errors correctly', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const updateData: UpdateScheduleData = {
      laboratory_id: 'invalid_lab',
    }

    // Mock database error
    mockDb.update = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockRejectedValue(new Error('Foreign key constraint violation')),
        })),
      })),
    })) as any

    await expect(service.updateSchedule('schedule123', updateData)).rejects.toThrow(
      'Foreign key constraint violation',
    )

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to update schedule', {
      error: 'Foreign key constraint violation',
      scheduleId: 'schedule123',
      timestamp: expect.any(String),
    })
  })
})

describe('scheduleService.deleteSchedule', () => {
  it('successfully deletes a schedule', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const mockDeletedSchedule = {
      id: 'schedule123',
      laboratory_id: 'lab001',
      teacher_id: 'teacher456',
      subject_id: 'subj789',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
      status: 'active',
      created_at: mockCreatedAt,
      updated_at: mockUpdatedAt,
    }

    mockDb.setDeleteResults([mockDeletedSchedule])

    const result = await service.deleteSchedule('schedule123')

    expect(result).toEqual(mockDeletedSchedule)
    expect(mockDb.delete).toHaveBeenCalled()

    expect(mockLogger.info).toHaveBeenCalledWith('Schedule deleted successfully', {
      scheduleId: 'schedule123',
      laboratoryId: 'lab001',
      timestamp: expect.any(String),
    })
  })

  it('throws error when schedule is not found', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    mockDb.setDeleteResults([])

    await expect(service.deleteSchedule('nonexistent_schedule')).rejects.toThrow(
      'Schedule not found',
    )

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete schedule', {
      error: 'Schedule not found',
      scheduleId: 'nonexistent_schedule',
      timestamp: expect.any(String),
    })
  })

  it('handles database errors correctly', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    // Mock database error
    mockDb.delete = vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      })),
    })) as any

    await expect(service.deleteSchedule('schedule123')).rejects.toThrow(
      'Database connection failed',
    )

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete schedule', {
      error: 'Database connection failed',
      scheduleId: 'schedule123',
      timestamp: expect.any(String),
    })
  })
})

describe('scheduleService.listSchedules', () => {
  it('successfully retrieves schedules with default pagination', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const mockSchedules = [
      {
        id: 'schedule1',
        laboratory_id: 'lab001',
        teacher_id: 'teacher123',
        subject_id: 'subj456',
        section: 'CS101-A',
        start_time: new Date('2025-10-28T08:00:00Z'),
        end_time: new Date('2025-10-28T10:00:00Z'),
        status: 'active',
        created_at: mockCreatedAt,
        updated_at: mockUpdatedAt,
      },
      {
        id: 'schedule2',
        laboratory_id: 'lab002',
        teacher_id: 'teacher456',
        subject_id: 'subj789',
        section: 'CS102-B',
        start_time: new Date('2025-10-28T13:00:00Z'),
        end_time: new Date('2025-10-28T15:00:00Z'),
        status: 'completed',
        created_at: mockCreatedAt,
        updated_at: mockUpdatedAt,
      },
    ]

    mockDb.setSelectResults(mockSchedules)

    const result = await service.listSchedules({ page: 1, limit: 10 })

    expect(result.schedules).toEqual(mockSchedules)
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })

    expect(mockLogger.info).toHaveBeenCalledWith('Schedules list retrieved successfully', {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      returned_count: 2,
      timestamp: expect.any(String),
    })
  })

  it('successfully retrieves schedules with custom pagination', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const mockSchedules = [
      {
        id: 'schedule6',
        laboratory_id: 'lab003',
        teacher_id: 'teacher789',
        subject_id: 'subj123',
        section: 'CS103-C',
        start_time: new Date('2025-10-28T10:00:00Z'),
        end_time: new Date('2025-10-28T12:00:00Z'),
        status: 'active',
        created_at: mockCreatedAt,
        updated_at: mockUpdatedAt,
      },
    ]

    // Mock the count to return a larger number
    mockDb.setSelectResults(mockSchedules)
    mockDb.setCountValue(11)

    const result = await service.listSchedules({ page: 2, limit: 5 })

    expect(result.schedules).toEqual(mockSchedules)
    expect(result.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 11,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    })

    expect(mockLogger.info).toHaveBeenCalledWith('Schedules list retrieved successfully', {
      page: 2,
      limit: 5,
      total: 11,
      totalPages: 3,
      returned_count: 1,
      timestamp: expect.any(String),
    })
  })

  it('successfully retrieves empty list when no schedules exist', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    mockDb.setSelectResults([])

    const result = await service.listSchedules({ page: 1, limit: 10 })

    expect(result.schedules).toEqual([])
    expect(result.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })

    expect(mockLogger.info).toHaveBeenCalledWith('Schedules list retrieved successfully', {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      returned_count: 0,
      timestamp: expect.any(String),
    })
  })

  it('correctly calculates pagination on last page', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    const mockSchedules = [
      {
        id: 'schedule25',
        laboratory_id: 'lab005',
        teacher_id: 'teacher999',
        subject_id: 'subj555',
        section: 'CS105-E',
        start_time: new Date('2025-10-30T14:00:00Z'),
        end_time: new Date('2025-10-30T16:00:00Z'),
        status: null,
        created_at: mockCreatedAt,
        updated_at: mockUpdatedAt,
      },
    ]

    mockDb.setSelectResults(mockSchedules)
    mockDb.setCountValue(25)

    const result = await service.listSchedules({ page: 3, limit: 10 })

    expect(result.schedules).toEqual(mockSchedules)
    expect(result.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: false,
      hasPrev: true,
    })
  })

  it('handles database errors correctly', async () => {
    const ctx = createFakeContext()
    const service = new ScheduleService(ctx)
    const mockDb = getMockDb(service)

    // Mock database error - need to reject in the from() method to match the actual query structure
    mockDb.select = vi.fn((_fields?: any) => ({
      from: vi.fn(() => {
        throw new Error('Database query failed')
      }),
    })) as any

    await expect(service.listSchedules({ page: 1, limit: 10 })).rejects.toThrow(
      'Database query failed',
    )

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to retrieve schedules list', {
      error: 'Database query failed',
      page: 1,
      limit: 10,
      timestamp: expect.any(String),
    })
  })
})
