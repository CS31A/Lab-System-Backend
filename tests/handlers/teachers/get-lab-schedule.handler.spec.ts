import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetLabScheduleHandler } from '@/handlers/teachers/get-lab-schedule.handler'

// Mock the TeacherService
const mockGetLabScheduleById = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/services/TeacherService', () => ({
  TeacherService: vi.fn().mockImplementation(() => ({
    getLabScheduleById: mockGetLabScheduleById,
  })),
}))

function createMockContext(labId: string): Context {
  return {
    req: {
      valid: vi.fn().mockReturnValue({ labId }),
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

describe('getLabScheduleHandler', () => {
  it('should successfully retrieve laboratory schedules and return 200 status', async () => {
    const labId = 'lab123'
    const mockContext = createMockContext(labId)
    const mockSchedules = [
      {
        id: 'sched001',
        section: 'CS-3A',
        start_time: new Date('2024-01-15T08:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        status: 'scheduled',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        subject: {
          id: 'subj001',
          name: 'Data Structures',
          code: 'CS301',
        },
        teacher: {
          id: 'teacher001',
          firstname: 'John',
          lastname: 'Doe',
        },
        laboratory: {
          id: labId,
          name: 'Computer Lab 1',
        },
      },
      {
        id: 'sched002',
        section: 'CS-3B',
        start_time: new Date('2024-01-15T13:00:00Z'),
        end_time: new Date('2024-01-15T15:00:00Z'),
        status: 'scheduled',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        subject: {
          id: 'subj002',
          name: 'Algorithms',
          code: 'CS302',
        },
        teacher: {
          id: 'teacher002',
          firstname: 'Jane',
          lastname: 'Smith',
        },
        laboratory: {
          id: labId,
          name: 'Computer Lab 1',
        },
      },
    ]

    mockGetLabScheduleById.mockResolvedValue(mockSchedules)

    const handler = GetLabScheduleHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockContext.req.valid).toHaveBeenCalledWith('param')
    expect(mockGetLabScheduleById).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratory schedules retrieved successfully',
        data: mockSchedules,
      },
      200,
    )
  })

  it('should return empty array when laboratory has no schedules', async () => {
    const labId = 'lab123'
    const mockContext = createMockContext(labId)
    const emptySchedules: any[] = []

    mockGetLabScheduleById.mockResolvedValue(emptySchedules)

    const handler = GetLabScheduleHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabScheduleById).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratory schedules retrieved successfully',
        data: emptySchedules,
      },
      200,
    )
  })

  it('should return 404 when laboratory does not exist', async () => {
    const labId = 'nonexistent123'
    const mockContext = createMockContext(labId)

    mockGetLabScheduleById.mockRejectedValue(new Error('Laboratory not found'))

    const handler = GetLabScheduleHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabScheduleById).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratory not found',
      },
      404,
    )
  })

  it('should handle internal server errors and return 500 status', async () => {
    const labId = 'lab123'
    const mockContext = createMockContext(labId)
    const errorMessage = 'Database connection failed'

    mockGetLabScheduleById.mockRejectedValue(new Error(errorMessage))

    const handler = GetLabScheduleHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabScheduleById).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: errorMessage,
      },
      500,
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to retrieve laboratory schedules',
      {
        error: errorMessage,
        laboratoryId: labId,
        timestamp: expect.any(String),
      },
    )
  })

  it('should handle schedules with null teacher names gracefully', async () => {
    const labId = 'lab123'
    const mockContext = createMockContext(labId)
    const mockSchedules = [
      {
        id: 'sched001',
        section: 'CS-3A',
        start_time: new Date('2024-01-15T08:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        status: 'scheduled',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        subject: {
          id: 'subj001',
          name: 'Data Structures',
          code: 'CS301',
        },
        teacher: {
          id: 'teacher001',
          firstname: null,
          lastname: null,
        },
        laboratory: {
          id: labId,
          name: 'Computer Lab 1',
        },
      },
    ]

    mockGetLabScheduleById.mockResolvedValue(mockSchedules)

    const handler = GetLabScheduleHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabScheduleById).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratory schedules retrieved successfully',
        data: mockSchedules,
      },
      200,
    )
  })

  it('should handle schedules with null status', async () => {
    const labId = 'lab123'
    const mockContext = createMockContext(labId)
    const mockSchedules = [
      {
        id: 'sched001',
        section: 'CS-3A',
        start_time: new Date('2024-01-15T08:00:00Z'),
        end_time: new Date('2024-01-15T10:00:00Z'),
        status: null,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        subject: {
          id: 'subj001',
          name: 'Data Structures',
          code: 'CS301',
        },
        teacher: {
          id: 'teacher001',
          firstname: 'John',
          lastname: 'Doe',
        },
        laboratory: {
          id: labId,
          name: 'Computer Lab 1',
        },
      },
    ]

    mockGetLabScheduleById.mockResolvedValue(mockSchedules)

    const handler = GetLabScheduleHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabScheduleById).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratory schedules retrieved successfully',
        data: mockSchedules,
      },
      200,
    )
  })
})
