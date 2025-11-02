import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetLabAvailabilityHandler } from '@/handlers/teachers/get-lab-availability.handler'

// Mock the TeacherService
const mockGetLabAvailability = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/services/TeacherService', () => ({
  TeacherService: vi.fn().mockImplementation(() => ({
    getLabAvailability: mockGetLabAvailability,
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

describe('getLabAvailabilityHandler', () => {
  it('should return available status when laboratory is free', async () => {
    const labId = 'lab123'
    const mockContext = createMockContext(labId)
    const mockAvailability = {
      laboratory: {
        id: labId,
        name: 'Computer Lab 1',
        status: true,
      },
      is_available: true,
      availability_status: 'available',
      current_schedule: null,
      checked_at: '2024-01-15T10:00:00.000Z',
    }

    mockGetLabAvailability.mockResolvedValue(mockAvailability)

    const handler = GetLabAvailabilityHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockContext.req.valid).toHaveBeenCalledWith('param')
    expect(mockGetLabAvailability).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratory availability checked successfully',
        data: mockAvailability,
      },
      200,
    )
  })

  it('should return occupied status when laboratory has active schedule', async () => {
    const labId = 'lab123'
    const mockContext = createMockContext(labId)
    const mockAvailability = {
      laboratory: {
        id: labId,
        name: 'Computer Lab 1',
        status: true,
      },
      is_available: false,
      availability_status: 'occupied',
      current_schedule: {
        id: 'sched001',
        section: 'CS-3A',
        start_time: '2024-01-15T08:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        status: 'scheduled',
        subject: {
          name: 'Data Structures',
          code: 'CS301',
        },
        teacher: {
          name: 'John Doe',
        },
      },
      checked_at: '2024-01-15T09:00:00.000Z',
    }

    mockGetLabAvailability.mockResolvedValue(mockAvailability)

    const handler = GetLabAvailabilityHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabAvailability).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratory availability checked successfully',
        data: mockAvailability,
      },
      200,
    )
  })

  it('should return maintenance status when laboratory is under maintenance', async () => {
    const labId = 'lab123'
    const mockContext = createMockContext(labId)
    const mockAvailability = {
      laboratory: {
        id: labId,
        name: 'Computer Lab 1',
        status: false,
      },
      is_available: false,
      availability_status: 'maintenance',
      current_schedule: null,
      checked_at: '2024-01-15T10:00:00.000Z',
    }

    mockGetLabAvailability.mockResolvedValue(mockAvailability)

    const handler = GetLabAvailabilityHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabAvailability).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratory availability checked successfully',
        data: mockAvailability,
      },
      200,
    )
  })

  it('should return 404 when laboratory does not exist', async () => {
    const labId = 'nonexistent123'
    const mockContext = createMockContext(labId)

    mockGetLabAvailability.mockRejectedValue(new Error('Laboratory not found'))

    const handler = GetLabAvailabilityHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabAvailability).toHaveBeenCalledWith(labId)
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

    mockGetLabAvailability.mockRejectedValue(new Error(errorMessage))

    const handler = GetLabAvailabilityHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabAvailability).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: errorMessage,
      },
      500,
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to check laboratory availability',
      {
        error: errorMessage,
        laboratoryId: labId,
        timestamp: expect.any(String),
      },
    )
  })

  it('should handle schedule with null status', async () => {
    const labId = 'lab123'
    const mockContext = createMockContext(labId)
    const mockAvailability = {
      laboratory: {
        id: labId,
        name: 'Computer Lab 1',
        status: true,
      },
      is_available: false,
      availability_status: 'occupied',
      current_schedule: {
        id: 'sched001',
        section: 'CS-3A',
        start_time: '2024-01-15T08:00:00.000Z',
        end_time: '2024-01-15T10:00:00.000Z',
        status: null,
        subject: {
          name: 'Data Structures',
          code: 'CS301',
        },
        teacher: {
          name: 'John Doe',
        },
      },
      checked_at: '2024-01-15T09:00:00.000Z',
    }

    mockGetLabAvailability.mockResolvedValue(mockAvailability)

    const handler = GetLabAvailabilityHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabAvailability).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratory availability checked successfully',
        data: mockAvailability,
      },
      200,
    )
  })

  it('should include timestamp in checked_at field', async () => {
    const labId = 'lab123'
    const mockContext = createMockContext(labId)
    const checkedTime = '2024-01-15T10:30:00.000Z'
    const mockAvailability = {
      laboratory: {
        id: labId,
        name: 'Computer Lab 1',
        status: true,
      },
      is_available: true,
      availability_status: 'available',
      current_schedule: null,
      checked_at: checkedTime,
    }

    mockGetLabAvailability.mockResolvedValue(mockAvailability)

    const handler = GetLabAvailabilityHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetLabAvailability).toHaveBeenCalledWith(labId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratory availability checked successfully',
        data: expect.objectContaining({
          checked_at: checkedTime,
        }),
      },
      200,
    )
  })
})
