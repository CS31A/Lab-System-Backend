import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetTeacherLaboratoriesHandler } from '@/handlers/teachers/get-teacher-laboratories.handler'

// Mock the TeacherService
const mockGetLaboratoriesWithCurrentStatus = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/services/TeacherService', () => ({
  TeacherService: vi.fn().mockImplementation(() => ({
    getLaboratoriesWithCurrentStatus: mockGetLaboratoriesWithCurrentStatus,
  })),
}))

function createMockContext(): Context {
  return {
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

describe('getTeacherLaboratoriesHandler', () => {
  it('should successfully retrieve laboratories and return 200 status', async () => {
    const mockContext = createMockContext()
    const mockLaboratories = [
      {
        id: 'lab001',
        name: 'Computer Lab 1',
        status: true,
        scheduleId: 'sched001',
        section: 'CS-3A',
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T10:00:00Z'),
        subjectName: 'Data Structures',
        teacherFirstname: 'John',
        teacherLastname: 'Doe',
      },
      {
        id: 'lab002',
        name: 'Computer Lab 2',
        status: true,
        scheduleId: null,
        section: null,
        startTime: null,
        endTime: null,
        subjectName: null,
        teacherFirstname: null,
        teacherLastname: null,
      },
    ]

    // Set up the mock to return the test data
    mockGetLaboratoriesWithCurrentStatus.mockResolvedValue(mockLaboratories)

    const handler = GetTeacherLaboratoriesHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    // Verify the TeacherService was called
    expect(mockGetLaboratoriesWithCurrentStatus).toHaveBeenCalledOnce()

    // Verify the response
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratories with current status retrieved successfully',
        data: mockLaboratories,
      },
      200,
    )
  })

  it('should handle errors and return 500 status', async () => {
    const mockContext = createMockContext()
    const errorMessage = 'Database connection failed'

    // Mock the TeacherService method to throw an error
    mockGetLaboratoriesWithCurrentStatus.mockRejectedValue(new Error(errorMessage))

    const handler = GetTeacherLaboratoriesHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    // Verify the TeacherService was called
    expect(mockGetLaboratoriesWithCurrentStatus).toHaveBeenCalledOnce()

    // Verify the error response
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: errorMessage,
      },
      500,
    )

    // Verify error logger was called
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to retrieve laboratories',
      {
        error: errorMessage,
        timestamp: expect.any(String),
      },
    )
  })

  it('should handle empty laboratories array', async () => {
    const mockContext = createMockContext()
    const emptyLaboratories: any[] = []

    // Mock the TeacherService method
    mockGetLaboratoriesWithCurrentStatus.mockResolvedValue(emptyLaboratories)

    const handler = GetTeacherLaboratoriesHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    // Verify the TeacherService was called
    expect(mockGetLaboratoriesWithCurrentStatus).toHaveBeenCalledOnce()

    // Verify the response
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Laboratories with current status retrieved successfully',
        data: emptyLaboratories,
      },
      200,
    )
  })
})
