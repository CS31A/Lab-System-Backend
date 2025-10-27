import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateScheduleHandler } from '@/handlers/schedule/schedule.handler'

interface CreateScheduleSchemaData {
  laboratory_id: string
  teacher_id: string
  subject_id: string
  section: string
  start_time: Date
  end_time: Date
  status?: string | null
}

const mockCreateSchedule = vi.fn()
vi.mock('@/services/ScheduleService', () => ({
  ScheduleService: vi.fn().mockImplementation(() => ({
    createSchedule: mockCreateSchedule,
  })),
}))

function createMockContext(validatedData: CreateScheduleSchemaData): Context {
  return {
    req: {
      valid: vi.fn().mockReturnValue(validatedData),
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

describe('createScheduleHandler Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully creates schedule with complete schema data', async () => {
    const schemaData: CreateScheduleSchemaData = {
      laboratory_id: 'lab001',
      teacher_id: 'teacher123',
      subject_id: 'subj456',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
      status: 'active',
    }

    const mockSchedule = {
      id: 'schedule789',
      ...schemaData,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockCreateSchedule.mockResolvedValue(mockSchedule)

    const ctx = createMockContext(schemaData)
    const handler = CreateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockCreateSchedule).toHaveBeenCalledWith(schemaData)

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule created successfully',
        data: mockSchedule,
      },
      201,
    )
  })

  it('successfully creates schedule without optional status field', async () => {
    const schemaData: CreateScheduleSchemaData = {
      laboratory_id: 'lab002',
      teacher_id: 'teacher456',
      subject_id: 'subj789',
      section: 'CS102-B',
      start_time: new Date('2025-10-28T13:00:00Z'),
      end_time: new Date('2025-10-28T15:00:00Z'),
    }

    const mockSchedule = {
      id: 'schedule123',
      ...schemaData,
      status: null,
      created_at: new Date(),
      updated_at: new Date(),
    }

    mockCreateSchedule.mockResolvedValue(mockSchedule)

    const ctx = createMockContext(schemaData)
    const handler = CreateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockCreateSchedule).toHaveBeenCalledWith(schemaData)

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule created successfully',
        data: mockSchedule,
      },
      201,
    )
  })

  it('handles database constraint errors correctly', async () => {
    const schemaData: CreateScheduleSchemaData = {
      laboratory_id: 'invalid_lab',
      teacher_id: 'teacher123',
      subject_id: 'subj456',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
    }

    mockCreateSchedule.mockRejectedValue(new Error('Foreign key constraint violation'))

    const ctx = createMockContext(schemaData)
    const handler = CreateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Schedule creation failed', {
      error: 'Foreign key constraint violation',
      scheduleData: schemaData,
      timestamp: expect.any(String),
    })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'Foreign key constraint violation',
      },
      500,
    )
  })

  it('handles overlapping schedule conflicts', async () => {
    const schemaData: CreateScheduleSchemaData = {
      laboratory_id: 'lab001',
      teacher_id: 'teacher123',
      subject_id: 'subj456',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
    }

    mockCreateSchedule.mockRejectedValue(new Error('Schedule conflict detected'))

    const ctx = createMockContext(schemaData)
    const handler = CreateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Schedule creation failed', {
      error: 'Schedule conflict detected',
      scheduleData: schemaData,
      timestamp: expect.any(String),
    })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'Schedule conflict detected',
      },
      500,
    )
  })

  it('handles general service errors correctly', async () => {
    const schemaData: CreateScheduleSchemaData = {
      laboratory_id: 'lab001',
      teacher_id: 'teacher123',
      subject_id: 'subj456',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
    }

    mockCreateSchedule.mockRejectedValue(new Error('Database connection failed'))

    const ctx = createMockContext(schemaData)
    const handler = CreateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Schedule creation failed', {
      error: 'Database connection failed',
      scheduleData: schemaData,
      timestamp: expect.any(String),
    })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Internal Server Error',
        errors: 'Database connection failed',
      },
      500,
    )
  })
})
