import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GetScheduleHandler } from '@/handlers/schedule/schedule.handler'

interface ParamData {
  id: string
}

const mockGetScheduleById = vi.fn()
vi.mock('@/services/ScheduleService', () => ({
  ScheduleService: vi.fn().mockImplementation(() => ({
    getScheduleById: mockGetScheduleById,
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

describe('getScheduleHandler Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully retrieves schedule by valid ID', async () => {
    const paramData: ParamData = { id: 'schedule123' }

    const mockSchedule = {
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

    mockGetScheduleById.mockResolvedValue(mockSchedule)

    const ctx = createMockContext(paramData)
    const handler = GetScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockGetScheduleById).toHaveBeenCalledWith('schedule123')

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule retrieved successfully',
        data: mockSchedule,
      },
      200,
    )
  })

  it('returns 404 when schedule is not found', async () => {
    const paramData: ParamData = { id: 'nonexistent_schedule' }

    mockGetScheduleById.mockResolvedValue(null)

    const ctx = createMockContext(paramData)
    const handler = GetScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockGetScheduleById).toHaveBeenCalledWith('nonexistent_schedule')

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule not found',
      },
      404,
    )
  })

  it('handles service errors correctly', async () => {
    const paramData: ParamData = { id: 'schedule123' }

    mockGetScheduleById.mockRejectedValue(new Error('Database query failed'))

    const ctx = createMockContext(paramData)
    const handler = GetScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Failed to retrieve schedule', {
      error: 'Database query failed',
      scheduleId: 'schedule123',
      timestamp: expect.any(String),
    })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'Database query failed',
      },
      500,
    )
  })

  it('successfully retrieves schedule with null status', async () => {
    const paramData: ParamData = { id: 'schedule456' }

    const mockSchedule = {
      id: 'schedule456',
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

    mockGetScheduleById.mockResolvedValue(mockSchedule)

    const ctx = createMockContext(paramData)
    const handler = GetScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockGetScheduleById).toHaveBeenCalledWith('schedule456')

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule retrieved successfully',
        data: mockSchedule,
      },
      200,
    )
  })

  it('handles database connection errors', async () => {
    const paramData: ParamData = { id: 'schedule123' }

    mockGetScheduleById.mockRejectedValue(new Error('Database connection timeout'))

    const ctx = createMockContext(paramData)
    const handler = GetScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Failed to retrieve schedule', {
      error: 'Database connection timeout',
      scheduleId: 'schedule123',
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
})
