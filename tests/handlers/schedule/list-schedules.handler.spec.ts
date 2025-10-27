import type { Context } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ListSchedulesHandler } from '@/handlers/schedule/schedule.handler'

interface QueryData {
  page?: number
  limit?: number
}

const mockListSchedules = vi.fn()
vi.mock('@/services/ScheduleService', () => ({
  ScheduleService: vi.fn().mockImplementation(() => ({
    listSchedules: mockListSchedules,
  })),
}))

function createMockContext(queryData: QueryData): Context {
  return {
    req: {
      valid: vi.fn().mockImplementation((type: string) => {
        if (type === 'query')
          return queryData
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

describe('listSchedulesHandler Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully retrieves schedules with default pagination', async () => {
    const queryData: QueryData = {}

    const mockSchedules = [
      {
        id: 'schedule1',
        laboratory_id: 'lab001',
        teacher_id: 'teacher123',
        subject_id: 'subj456',
        section: 'CS101-A',
        start_time: new Date('2025-10-28T08:00:00Z'),
        end_time: new Date('2025-10-28T10:00:00Z'),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'schedule2',
        laboratory_id: 'lab002',
        teacher_id: 'teacher456',
        subject_id: 'subj789',
        section: 'CS102-B',
        start_time: new Date('2025-10-28T13:00:00Z'),
        end_time: new Date('2025-10-28T15:00:00Z'),
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]

    const mockResult = {
      schedules: mockSchedules,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    }

    mockListSchedules.mockResolvedValue(mockResult)

    const ctx = createMockContext(queryData)
    const handler = ListSchedulesHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockListSchedules).toHaveBeenCalledWith({ page: 1, limit: 10 })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedules retrieved successfully',
        data: mockSchedules,
        pagination: mockResult.pagination,
      },
      200,
    )
  })

  it('successfully retrieves schedules with custom pagination', async () => {
    const queryData: QueryData = { page: 2, limit: 5 }

    const mockSchedules = [
      {
        id: 'schedule6',
        laboratory_id: 'lab003',
        teacher_id: 'teacher789',
        subject_id: 'subj123',
        section: 'CS103-C',
        start_time: new Date('2025-10-28T10:00:00Z'),
        end_time: new Date('2025-10-28T12:00:00Z'),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]

    const mockResult = {
      schedules: mockSchedules,
      pagination: {
        page: 2,
        limit: 5,
        total: 11,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      },
    }

    mockListSchedules.mockResolvedValue(mockResult)

    const ctx = createMockContext(queryData)
    const handler = ListSchedulesHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockListSchedules).toHaveBeenCalledWith({ page: 2, limit: 5 })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedules retrieved successfully',
        data: mockSchedules,
        pagination: mockResult.pagination,
      },
      200,
    )
  })

  it('successfully retrieves empty schedules list', async () => {
    const queryData: QueryData = { page: 1, limit: 10 }

    const mockResult = {
      schedules: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    }

    mockListSchedules.mockResolvedValue(mockResult)

    const ctx = createMockContext(queryData)
    const handler = ListSchedulesHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockListSchedules).toHaveBeenCalledWith({ page: 1, limit: 10 })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedules retrieved successfully',
        data: [],
        pagination: mockResult.pagination,
      },
      200,
    )
  })

  it('successfully retrieves schedules on last page', async () => {
    const queryData: QueryData = { page: 3, limit: 10 }

    const mockSchedules = [
      {
        id: 'schedule25',
        laboratory_id: 'lab005',
        teacher_id: 'teacher999',
        subject_id: 'subj555',
        section: 'CS105-E',
        start_time: new Date('2025-10-30T14:00:00Z'),
        end_time: new Date('2025-10-30T16:00:00Z'),
        status: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]

    const mockResult = {
      schedules: mockSchedules,
      pagination: {
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: false,
        hasPrev: true,
      },
    }

    mockListSchedules.mockResolvedValue(mockResult)

    const ctx = createMockContext(queryData)
    const handler = ListSchedulesHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockListSchedules).toHaveBeenCalledWith({ page: 3, limit: 10 })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedules retrieved successfully',
        data: mockSchedules,
        pagination: mockResult.pagination,
      },
      200,
    )
  })

  it('handles service errors correctly', async () => {
    const queryData: QueryData = { page: 1, limit: 10 }

    mockListSchedules.mockRejectedValue(new Error('Database query failed'))

    const ctx = createMockContext(queryData)
    const handler = ListSchedulesHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Failed to retrieve schedules list', {
      error: 'Database query failed',
      page: 1,
      limit: 10,
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

  it('handles database connection errors', async () => {
    const queryData: QueryData = { page: 1, limit: 10 }

    mockListSchedules.mockRejectedValue(new Error('Database connection timeout'))

    const ctx = createMockContext(queryData)
    const handler = ListSchedulesHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(ctx.var.logger.error).toHaveBeenCalledWith('Failed to retrieve schedules list', {
      error: 'Database connection timeout',
      page: 1,
      limit: 10,
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

  it('successfully retrieves schedules with large page number', async () => {
    const queryData: QueryData = { page: 100, limit: 10 }

    const mockResult = {
      schedules: [],
      pagination: {
        page: 100,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNext: false,
        hasPrev: true,
      },
    }

    mockListSchedules.mockResolvedValue(mockResult)

    const ctx = createMockContext(queryData)
    const handler = ListSchedulesHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockListSchedules).toHaveBeenCalledWith({ page: 100, limit: 10 })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedules retrieved successfully',
        data: [],
        pagination: mockResult.pagination,
      },
      200,
    )
  })

  it('successfully retrieves schedules with various status values', async () => {
    const queryData: QueryData = { page: 1, limit: 10 }

    const mockSchedules = [
      {
        id: 'schedule1',
        laboratory_id: 'lab001',
        teacher_id: 'teacher123',
        subject_id: 'subj456',
        section: 'CS101-A',
        start_time: new Date('2025-10-28T08:00:00Z'),
        end_time: new Date('2025-10-28T10:00:00Z'),
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'schedule2',
        laboratory_id: 'lab002',
        teacher_id: 'teacher456',
        subject_id: 'subj789',
        section: 'CS102-B',
        start_time: new Date('2025-10-28T13:00:00Z'),
        end_time: new Date('2025-10-28T15:00:00Z'),
        status: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 'schedule3',
        laboratory_id: 'lab003',
        teacher_id: 'teacher789',
        subject_id: 'subj123',
        section: 'CS103-C',
        start_time: new Date('2025-10-28T16:00:00Z'),
        end_time: new Date('2025-10-28T18:00:00Z'),
        status: 'cancelled',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]

    const mockResult = {
      schedules: mockSchedules,
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    }

    mockListSchedules.mockResolvedValue(mockResult)

    const ctx = createMockContext(queryData)
    const handler = ListSchedulesHandler as unknown as (c: Context) => Promise<Response>
    const _result = await handler(ctx)

    expect(mockListSchedules).toHaveBeenCalledWith({ page: 1, limit: 10 })

    expect(ctx.json).toHaveBeenCalledWith(
      {
        message: 'Schedules retrieved successfully',
        data: mockSchedules,
        pagination: mockResult.pagination,
      },
      200,
    )
  })
})
