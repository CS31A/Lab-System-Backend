import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeleteScheduleHandler } from '@/handlers/schedule/schedule.handler'

interface ParamData {
  id: string
}

const mockDeleteSchedule = vi.fn()
vi.mock('@/services/ScheduleService', () => ({
  ScheduleService: vi.fn().mockImplementation(() => ({
    deleteSchedule: mockDeleteSchedule,
  })),
}))

function createMockContext(paramData: ParamData): Context {
  return {
    req: {
      valid: vi.fn().mockImplementation((type: string) => {
        if (type === 'param')
          return paramData
        return {}
      }),
    },
    var: {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
      },
    },
    json: vi.fn().mockImplementation((data, status) => ({ data, status })),
  } as unknown as Context
}

describe('deleteScheduleHandler Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully deletes schedule by valid ID', async () => {
    const paramData: ParamData = { id: 'schedule123' }

    const mockDeletedSchedule = {
      id: 'schedule123',
      laboratory_id: 'lab001',
      teacher_id: 'teacher456',
      subject_id: 'subj789',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockDeleteSchedule.mockResolvedValue(mockDeletedSchedule)

    const ctx = createMockContext(paramData)
    const handler = DeleteScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockDeleteSchedule).toHaveBeenCalledWith('schedule123')

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule deleted successfully',
      },
      200,
    )
  })

  it('returns 404 when schedule to delete is not found', async () => {
    const paramData: ParamData = { id: 'nonexistent_schedule' }

    mockDeleteSchedule.mockRejectedValue(new Error('Schedule not found'))

    const ctx = createMockContext(paramData)
    const handler = DeleteScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockDeleteSchedule).toHaveBeenCalledWith('nonexistent_schedule')

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule not found',
      },
      404,
    )
  })

  it('handles service errors correctly', async () => {
    const paramData: ParamData = { id: 'schedule456' }

    mockDeleteSchedule.mockRejectedValue(new Error('Database deletion failed'))

    const ctx = createMockContext(paramData)
    const handler = DeleteScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Schedule deletion failed', {
      error: 'Database deletion failed',
      scheduleId: 'schedule456',
      timestamp: expect.any(String),
    })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'Database deletion failed',
      },
      500,
    )
  })

  it('handles database connection errors', async () => {
    const paramData: ParamData = { id: 'schedule789' }

    mockDeleteSchedule.mockRejectedValue(new Error('Database connection timeout'))

    const ctx = createMockContext(paramData)
    const handler = DeleteScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Schedule deletion failed', {
      error: 'Database connection timeout',
      scheduleId: 'schedule789',
      timestamp: expect.any(String),
    })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'Database connection timeout',
      },
      500,
    )
  })

  it('handles foreign key constraint errors on deletion', async () => {
    const paramData: ParamData = { id: 'schedule123' }

    mockDeleteSchedule.mockRejectedValue(new Error('Cannot delete schedule with existing dependencies'))

    const ctx = createMockContext(paramData)
    const handler = DeleteScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Schedule deletion failed', {
      error: 'Cannot delete schedule with existing dependencies',
      scheduleId: 'schedule123',
      timestamp: expect.any(String),
    })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'Cannot delete schedule with existing dependencies',
      },
      500,
    )
  })

  it('successfully deletes schedule with null status', async () => {
    const paramData: ParamData = { id: 'schedule999' }

    const mockDeletedSchedule = {
      id: 'schedule999',
      laboratory_id: 'lab002',
      teacher_id: 'teacher789',
      subject_id: 'subj123',
      section: 'CS102-B',
      start_time: new Date('2025-10-28T13:00:00Z'),
      end_time: new Date('2025-10-28T15:00:00Z'),
      status: null,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockDeleteSchedule.mockResolvedValue(mockDeletedSchedule)

    const ctx = createMockContext(paramData)
    const handler = DeleteScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockDeleteSchedule).toHaveBeenCalledWith('schedule999')

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule deleted successfully',
      },
      200,
    )
  })
})
