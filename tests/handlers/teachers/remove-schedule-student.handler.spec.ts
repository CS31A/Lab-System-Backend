import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RemoveScheduleStudentHandler } from '@/handlers/teachers/remove-schedule-student.handler'

// Mock the TeacherService
const mockRemoveStudentFromSchedule = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/services/TeacherService', () => ({
  TeacherService: vi.fn().mockImplementation(() => ({
    removeStudentFromSchedule: mockRemoveStudentFromSchedule,
  })),
}))

function createMockContext(scheduleId: string, studentId: string): Context {
  return {
    req: {
      valid: vi.fn((type: string) => {
        if (type === 'param') {
          return { scheduleId, studentId }
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

describe('removeScheduleStudentHandler', () => {
  it('should successfully remove student from schedule and return 200 status', async () => {
    const scheduleId = 'sched123'
    const studentId = 'student001'
    const mockContext = createMockContext(scheduleId, studentId)

    mockRemoveStudentFromSchedule.mockResolvedValue(undefined)

    const handler = RemoveScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockRemoveStudentFromSchedule).toHaveBeenCalledWith(scheduleId, studentId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Student removed from schedule successfully',
      },
      200,
    )
  })

  it('should return 404 when schedule is not found', async () => {
    const scheduleId = 'nonexistent'
    const studentId = 'student001'
    const mockContext = createMockContext(scheduleId, studentId)

    mockRemoveStudentFromSchedule.mockRejectedValue(new Error('Schedule not found'))

    const handler = RemoveScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockRemoveStudentFromSchedule).toHaveBeenCalledWith(scheduleId, studentId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Schedule not found',
      },
      404,
    )
  })

  it('should return 404 when student not found in schedule', async () => {
    const scheduleId = 'sched123'
    const studentId = 'nonexistent'
    const mockContext = createMockContext(scheduleId, studentId)

    mockRemoveStudentFromSchedule.mockRejectedValue(new Error('Student not found in this schedule'))

    const handler = RemoveScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockRemoveStudentFromSchedule).toHaveBeenCalledWith(scheduleId, studentId)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Student not found in this schedule',
      },
      404,
    )
  })

  it('should handle errors and return 500 status', async () => {
    const scheduleId = 'sched123'
    const studentId = 'student001'
    const mockContext = createMockContext(scheduleId, studentId)
    const errorMessage = 'Database connection failed'

    mockRemoveStudentFromSchedule.mockRejectedValue(new Error(errorMessage))

    const handler = RemoveScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockRemoveStudentFromSchedule).toHaveBeenCalledWith(scheduleId, studentId)
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to remove student from schedule',
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

  it('should handle multiple removal attempts', async () => {
    const scheduleId = 'sched123'
    const studentId1 = 'student001'
    const studentId2 = 'student002'
    const mockContext1 = createMockContext(scheduleId, studentId1)
    const mockContext2 = createMockContext(scheduleId, studentId2)

    mockRemoveStudentFromSchedule.mockResolvedValue(undefined)

    const handler = RemoveScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext1)
    await handler(mockContext2)

    expect(mockRemoveStudentFromSchedule).toHaveBeenCalledTimes(2)
    expect(mockRemoveStudentFromSchedule).toHaveBeenNthCalledWith(1, scheduleId, studentId1)
    expect(mockRemoveStudentFromSchedule).toHaveBeenNthCalledWith(2, scheduleId, studentId2)
  })
})
