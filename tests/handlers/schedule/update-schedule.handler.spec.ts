import type { ParamData, ScheduleSchemaData } from '@tests/types/test-helpers.types'
import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdateScheduleHandler } from '@/handlers/schedule/schedule.handler'

const mockUpdateSchedule = vi.fn()
vi.mock('@/services/ScheduleService', () => ({
  ScheduleService: vi.fn().mockImplementation(() => ({
    updateSchedule: mockUpdateSchedule,
  })),
}))

function createMockContext(paramData: ParamData, validatedData: ScheduleSchemaData): Context {
  return {
    req: {
      valid: vi.fn().mockImplementation((type: string) => {
        if (type === 'param')
          return paramData
        if (type === 'json')
          return validatedData
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

describe('updateScheduleHandler Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully updates all schedule fields', async () => {
    const paramData: ParamData = { id: 'schedule123' }
    const schemaData: ScheduleSchemaData = {
      laboratory_id: 'lab002',
      teacher_id: 'teacher789',
      subject_id: 'subj456',
      section: 'CS103-C',
      start_time: new Date('2025-10-29T09:00:00Z'),
      end_time: new Date('2025-10-29T11:00:00Z'),
      status: 'updated',
    }

    const mockUpdatedSchedule = {
      id: 'schedule123',
      ...schemaData,
      created_at: new Date('2025-10-27T00:00:00Z'),
      updated_at: new Date(),
    }

    mockUpdateSchedule.mockResolvedValue(mockUpdatedSchedule)

    const ctx = createMockContext(paramData, schemaData)
    const handler = UpdateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockUpdateSchedule).toHaveBeenCalledWith('schedule123', schemaData)

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule updated successfully',
        data: mockUpdatedSchedule,
      },
      200,
    )
  })

  it('successfully updates only laboratory_id field', async () => {
    const paramData: ParamData = { id: 'schedule456' }
    const schemaData: ScheduleSchemaData = {
      laboratory_id: 'lab003',
    }

    const mockUpdatedSchedule = {
      id: 'schedule456',
      laboratory_id: 'lab003',
      teacher_id: 'teacher123',
      subject_id: 'subj789',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
      status: 'active',
      created_at: new Date('2025-10-27T00:00:00Z'),
      updated_at: new Date(),
    }

    mockUpdateSchedule.mockResolvedValue(mockUpdatedSchedule)

    const ctx = createMockContext(paramData, schemaData)
    const handler = UpdateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockUpdateSchedule).toHaveBeenCalledWith('schedule456', schemaData)

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule updated successfully',
        data: mockUpdatedSchedule,
      },
      200,
    )
  })

  it('successfully updates only time fields', async () => {
    const paramData: ParamData = { id: 'schedule789' }
    const schemaData: ScheduleSchemaData = {
      start_time: new Date('2025-10-29T14:00:00Z'),
      end_time: new Date('2025-10-29T16:00:00Z'),
    }

    const mockUpdatedSchedule = {
      id: 'schedule789',
      laboratory_id: 'lab001',
      teacher_id: 'teacher456',
      subject_id: 'subj123',
      section: 'CS102-B',
      start_time: new Date('2025-10-29T14:00:00Z'),
      end_time: new Date('2025-10-29T16:00:00Z'),
      status: 'active',
      created_at: new Date('2025-10-27T00:00:00Z'),
      updated_at: new Date(),
    }

    mockUpdateSchedule.mockResolvedValue(mockUpdatedSchedule)

    const ctx = createMockContext(paramData, schemaData)
    const handler = UpdateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockUpdateSchedule).toHaveBeenCalledWith('schedule789', schemaData)

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule updated successfully',
        data: mockUpdatedSchedule,
      },
      200,
    )
  })

  it('successfully updates status to null', async () => {
    const paramData: ParamData = { id: 'schedule111' }
    const schemaData: ScheduleSchemaData = {
      status: null,
    }

    const mockUpdatedSchedule = {
      id: 'schedule111',
      laboratory_id: 'lab001',
      teacher_id: 'teacher123',
      subject_id: 'subj456',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
      status: null,
      created_at: new Date('2025-10-27T00:00:00Z'),
      updated_at: new Date(),
    }

    mockUpdateSchedule.mockResolvedValue(mockUpdatedSchedule)

    const ctx = createMockContext(paramData, schemaData)
    const handler = UpdateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockUpdateSchedule).toHaveBeenCalledWith('schedule111', schemaData)

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule updated successfully',
        data: mockUpdatedSchedule,
      },
      200,
    )
  })

  it('returns 404 when schedule to update is not found', async () => {
    const paramData: ParamData = { id: 'nonexistent_schedule' }
    const schemaData: ScheduleSchemaData = {
      section: 'CS104-D',
    }

    mockUpdateSchedule.mockRejectedValue(new Error('Schedule not found'))

    const ctx = createMockContext(paramData, schemaData)
    const handler = UpdateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule not found',
      },
      404,
    )
  })

  it('handles database constraint errors correctly', async () => {
    const paramData: ParamData = { id: 'schedule123' }
    const schemaData: ScheduleSchemaData = {
      laboratory_id: 'invalid_lab',
    }

    mockUpdateSchedule.mockRejectedValue(new Error('Foreign key constraint violation'))

    const ctx = createMockContext(paramData, schemaData)
    const handler = UpdateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Schedule update failed', {
      error: 'Foreign key constraint violation',
      scheduleId: 'schedule123',
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

  it('handles general service errors correctly', async () => {
    const paramData: ParamData = { id: 'schedule123' }
    const schemaData: ScheduleSchemaData = {
      section: 'CS105-E',
    }

    mockUpdateSchedule.mockRejectedValue(new Error('Database connection failed'))

    const ctx = createMockContext(paramData, schemaData)
    const handler = UpdateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Schedule update failed', {
      error: 'Database connection failed',
      scheduleId: 'schedule123',
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

  it('handles empty update data (no fields to update)', async () => {
    const paramData: ParamData = { id: 'schedule123' }
    const schemaData: ScheduleSchemaData = {}

    const mockUpdatedSchedule = {
      id: 'schedule123',
      laboratory_id: 'lab001',
      teacher_id: 'teacher123',
      subject_id: 'subj456',
      section: 'CS101-A',
      start_time: new Date('2025-10-28T08:00:00Z'),
      end_time: new Date('2025-10-28T10:00:00Z'),
      status: 'active',
      created_at: new Date('2025-10-27T00:00:00Z'),
      updated_at: new Date(),
    }

    mockUpdateSchedule.mockResolvedValue(mockUpdatedSchedule)

    const ctx = createMockContext(paramData, schemaData)
    const handler = UpdateScheduleHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockUpdateSchedule).toHaveBeenCalledWith('schedule123', schemaData)

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedule updated successfully',
        data: mockUpdatedSchedule,
      },
      200,
    )
  })
})
