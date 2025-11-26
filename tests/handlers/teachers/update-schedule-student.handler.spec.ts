import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdateScheduleStudentHandler } from '@/handlers/teachers/update-schedule-student.handler'

// Mock the TeacherService
const mockUpdateStudentInSchedule = vi.fn()
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

vi.mock('@/services/TeacherService', () => ({
  TeacherService: vi.fn().mockImplementation(() => ({
    updateStudentInSchedule: mockUpdateStudentInSchedule,
  })),
}))

function createMockContext(scheduleId: string, studentId: string, requestBody: any): Context {
  return {
    req: {
      valid: vi.fn((type: string) => {
        if (type === 'param') {
          return { scheduleId, studentId }
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

describe('updateScheduleStudentHandler', () => {
  it('should successfully update student in schedule and return 200 status', async () => {
    const scheduleId = 'sched123'
    const studentId = 'student001'
    const requestBody = {
      seat_number: 'B2',
      monitor_status: 'Defective',
    }
    const mockContext = createMockContext(scheduleId, studentId, requestBody)
    const mockResult = {
      id: 'seat001',
      laboratory_id: 'lab001',
      schedule_id: scheduleId,
      student_id: studentId,
      seat_number: 'B2',
      monitor_status: 'Defective',
      mouse_status: 'Good condition',
      keyboard_status: 'Good condition',
      cables_status: 'Good condition',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
    }

    mockUpdateStudentInSchedule.mockResolvedValue(mockResult)

    const handler = UpdateScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockUpdateStudentInSchedule).toHaveBeenCalledWith(scheduleId, studentId, requestBody)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Student updated in schedule successfully',
        data: mockResult,
      },
      200,
    )
  })

  it('should update only seat number', async () => {
    const scheduleId = 'sched123'
    const studentId = 'student001'
    const requestBody = {
      seat_number: 'C3',
    }
    const mockContext = createMockContext(scheduleId, studentId, requestBody)
    const mockResult = {
      id: 'seat001',
      laboratory_id: 'lab001',
      schedule_id: scheduleId,
      student_id: studentId,
      seat_number: 'C3',
      monitor_status: 'Good condition',
      mouse_status: 'Good condition',
      keyboard_status: 'Good condition',
      cables_status: 'Good condition',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
    }

    mockUpdateStudentInSchedule.mockResolvedValue(mockResult)

    const handler = UpdateScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockUpdateStudentInSchedule).toHaveBeenCalledWith(scheduleId, studentId, requestBody)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Student updated in schedule successfully',
        data: mockResult,
      },
      200,
    )
  })

  it('should update multiple equipment statuses', async () => {
    const scheduleId = 'sched123'
    const studentId = 'student001'
    const requestBody = {
      monitor_status: 'Defective',
      keyboard_status: 'Missing',
      cables_status: 'Defective',
    }
    const mockContext = createMockContext(scheduleId, studentId, requestBody)
    const mockResult = {
      id: 'seat001',
      laboratory_id: 'lab001',
      schedule_id: scheduleId,
      student_id: studentId,
      seat_number: 'A1',
      monitor_status: 'Defective',
      mouse_status: 'Good condition',
      keyboard_status: 'Missing',
      cables_status: 'Defective',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-02T00:00:00Z'),
    }

    mockUpdateStudentInSchedule.mockResolvedValue(mockResult)

    const handler = UpdateScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockUpdateStudentInSchedule).toHaveBeenCalledWith(scheduleId, studentId, requestBody)
    expect(mockContext.json).toHaveBeenCalledWith(
      {
        message: 'Student updated in schedule successfully',
        data: mockResult,
      },
      200,
    )
  })

  it('should return 404 when schedule is not found', async () => {
    const scheduleId = 'nonexistent'
    const studentId = 'student001'
    const requestBody = {
      seat_number: 'B2',
    }
    const mockContext = createMockContext(scheduleId, studentId, requestBody)

    mockUpdateStudentInSchedule.mockRejectedValue(new Error('Schedule not found'))

    const handler = UpdateScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockUpdateStudentInSchedule).toHaveBeenCalledWith(scheduleId, studentId, requestBody)
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
    const requestBody = {
      seat_number: 'B2',
    }
    const mockContext = createMockContext(scheduleId, studentId, requestBody)

    mockUpdateStudentInSchedule.mockRejectedValue(new Error('Student not found in this schedule'))

    const handler = UpdateScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockUpdateStudentInSchedule).toHaveBeenCalledWith(scheduleId, studentId, requestBody)
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
    const requestBody = {
      seat_number: 'B2',
    }
    const mockContext = createMockContext(scheduleId, studentId, requestBody)
    const errorMessage = 'Database connection failed'

    mockUpdateStudentInSchedule.mockRejectedValue(new Error(errorMessage))

    const handler = UpdateScheduleStudentHandler as unknown as (c: Context) => Promise<Response>
    await handler(mockContext)

    expect(mockUpdateStudentInSchedule).toHaveBeenCalledWith(scheduleId, studentId, requestBody)
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to update student in schedule',
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
