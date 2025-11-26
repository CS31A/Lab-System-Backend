import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetScheduleStudentsHandler } from '@/handlers/teachers/get-schedule-students.handler'

// Mock the TeacherService
const mockGetScheduleStudents = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/services/TeacherService', () => ({
  TeacherService: vi.fn().mockImplementation(() => ({
    getScheduleStudents: mockGetScheduleStudents,
  })),
}))

function createMockContext(scheduleId: string): Context {
  return {
    req: {
      valid: vi.fn((type: string) => {
        if (type === 'param') {
          return { scheduleId }
        }
        return {}
      }),
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

describe('getScheduleStudentsHandler', () => {
  it('should successfully retrieve schedule students and return 200 status', async () => {
    const scheduleId = 'sched123'
    const mockContext = createMockContext(scheduleId)
    const mockStudents = [
      {
        seating_plan_id: 'seat001',
        student_id: 'student001',
        firstname: 'John',
        lastname: 'Doe',
        student_number: 'S2024001',
        section: 'CS-3A',
        course: 'Computer Science',
        seat_number: 'A1',
        monitor_status: 'Good condition',
        mouse_status: 'Good condition',
        keyboard_status: 'Good condition',
        cables_status: 'Good condition',
      },
      {
        seating_plan_id: 'seat002',
        student_id: 'student002',
        firstname: 'Jane',
        lastname: 'Smith',
        student_number: 'S2024002',
        section: 'CS-3A',
        course: 'Computer Science',
        seat_number: 'A2',
        monitor_status: 'Good condition',
        mouse_status: 'Defective',
        keyboard_status: 'Good condition',
        cables_status: 'Good condition',
      },
    ]

    mockGetScheduleStudents.mockResolvedValue(mockStudents)

    const handler = GetScheduleStudentsHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetScheduleStudents).toHaveBeenCalledWith(scheduleId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Schedule students retrieved successfully',
        data: mockStudents,
      },
      200,
    )
  })

  it('should return empty array when no students are enrolled', async () => {
    const scheduleId = 'sched123'
    const mockContext = createMockContext(scheduleId)

    mockGetScheduleStudents.mockResolvedValue([])

    const handler = GetScheduleStudentsHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetScheduleStudents).toHaveBeenCalledWith(scheduleId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Schedule students retrieved successfully',
        data: [],
      },
      200,
    )
  })

  it('should return 404 when schedule is not found', async () => {
    const scheduleId = 'nonexistent'
    const mockContext = createMockContext(scheduleId)

    mockGetScheduleStudents.mockRejectedValue(new Error('Schedule not found'))

    const handler = GetScheduleStudentsHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetScheduleStudents).toHaveBeenCalledWith(scheduleId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Schedule not found',
      },
      404,
    )
  })

  it('should handle errors and return 500 status', async () => {
    const scheduleId = 'sched123'
    const mockContext = createMockContext(scheduleId)
    const errorMessage = 'Database connection failed'

    mockGetScheduleStudents.mockRejectedValue(new Error(errorMessage))

    const handler = GetScheduleStudentsHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockGetScheduleStudents).toHaveBeenCalledWith(scheduleId)
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to retrieve schedule students',
      expect.objectContaining({
        error: errorMessage,
      }),
    )
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: errorMessage,
      },
      500,
    )
  })
})
