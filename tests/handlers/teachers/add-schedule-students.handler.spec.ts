import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddScheduleStudentsHandler } from '@/handlers/teachers/add-schedule-students.handler'

// Mock the TeacherService
const mockAddStudentsToSchedule = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/services/TeacherService', () => ({
  TeacherService: vi.fn().mockImplementation(() => ({
    addStudentsToSchedule: mockAddStudentsToSchedule,
  })),
}))

function createMockContext(scheduleId: string, requestBody: any): Context {
  return {
    req: {
      valid: vi.fn((type: string) => {
        if (type === 'param') {
          return { scheduleId }
        }
        if (type === 'json') {
          return requestBody
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

describe('addScheduleStudentsHandler', () => {
  it('should successfully add students to schedule and return 201 status', async () => {
    const scheduleId = 'sched123'
    const requestBody = {
      students: [
        {
          student_id: 'student001',
          seat_number: 'A1',
          monitor_status: 'Good condition',
          mouse_status: 'Good condition',
          keyboard_status: 'Good condition',
          cables_status: 'Good condition',
        },
        {
          student_id: 'student002',
          seat_number: 'A2',
          monitor_status: 'Good condition',
          mouse_status: 'Good condition',
          keyboard_status: 'Good condition',
          cables_status: 'Good condition',
        },
      ],
    }
    const mockContext = createMockContext(scheduleId, requestBody)
    const mockResult = {
      added_count: 2,
      seating_plans: [
        {
          id: 'seat001',
          laboratory_id: 'lab001',
          schedule_id: scheduleId,
          student_id: 'student001',
          seat_number: 'A1',
          monitor_status: 'Good condition',
          mouse_status: 'Good condition',
          keyboard_status: 'Good condition',
          cables_status: 'Good condition',
        },
        {
          id: 'seat002',
          laboratory_id: 'lab001',
          schedule_id: scheduleId,
          student_id: 'student002',
          seat_number: 'A2',
          monitor_status: 'Good condition',
          mouse_status: 'Good condition',
          keyboard_status: 'Good condition',
          cables_status: 'Good condition',
        },
      ],
    }

    mockAddStudentsToSchedule.mockResolvedValue(mockResult)

    const handler = AddScheduleStudentsHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockAddStudentsToSchedule).toHaveBeenCalledWith(scheduleId, requestBody)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Students added to schedule successfully',
        data: mockResult,
      },
      201,
    )
  })

  it('should return 404 when schedule is not found', async () => {
    const scheduleId = 'nonexistent'
    const requestBody = {
      students: [
        {
          student_id: 'student001',
          seat_number: 'A1',
        },
      ],
    }
    const mockContext = createMockContext(scheduleId, requestBody)

    mockAddStudentsToSchedule.mockRejectedValue(new Error('Schedule not found'))

    const handler = AddScheduleStudentsHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockAddStudentsToSchedule).toHaveBeenCalledWith(scheduleId, requestBody)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Schedule not found',
      },
      404,
    )
  })

  it('should return 400 when student not found', async () => {
    const scheduleId = 'sched123'
    const requestBody = {
      students: [
        {
          student_id: 'nonexistent',
          seat_number: 'A1',
        },
      ],
    }
    const mockContext = createMockContext(scheduleId, requestBody)

    mockAddStudentsToSchedule.mockRejectedValue(new Error('Students not found: nonexistent'))

    const handler = AddScheduleStudentsHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockAddStudentsToSchedule).toHaveBeenCalledWith(scheduleId, requestBody)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Bad Request',
        errors: 'Students not found: nonexistent',
      },
      400,
    )
  })

  it('should return 400 when student already enrolled', async () => {
    const scheduleId = 'sched123'
    const requestBody = {
      students: [
        {
          student_id: 'student001',
          seat_number: 'A1',
        },
      ],
    }
    const mockContext = createMockContext(scheduleId, requestBody)

    mockAddStudentsToSchedule.mockRejectedValue(
      new Error('Students already enrolled in this schedule: student001'),
    )

    const handler = AddScheduleStudentsHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockAddStudentsToSchedule).toHaveBeenCalledWith(scheduleId, requestBody)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Bad Request',
        errors: 'Students already enrolled in this schedule: student001',
      },
      400,
    )
  })

  it('should handle errors and return 500 status', async () => {
    const scheduleId = 'sched123'
    const requestBody = {
      students: [
        {
          student_id: 'student001',
          seat_number: 'A1',
        },
      ],
    }
    const mockContext = createMockContext(scheduleId, requestBody)
    const errorMessage = 'Database connection failed'

    mockAddStudentsToSchedule.mockRejectedValue(new Error(errorMessage))

    const handler = AddScheduleStudentsHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockAddStudentsToSchedule).toHaveBeenCalledWith(scheduleId, requestBody)
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to add students to schedule',
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
