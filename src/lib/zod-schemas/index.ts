import { z } from '@hono/zod-openapi'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants'

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({
    param: {
      name: 'page',
      in: 'query',
    },
    example: '1',
    description: 'Page number for pagination (default: 1)',
  }),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE).openapi({
    param: {
      name: 'limit',
      in: 'query',
    },
    example: '10',
    description: 'Number of items per page (default: 10, max: 100)',
  }),
})

export const pagination = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
})

// Teacher dashboard schemas
export const scheduleWithDetailsSchema = z.object({
  scheduleId: z.string(),
  labId: z.string(),
  subjectCode: z.string(),
  subjectName: z.string(),
  section: z.string(),
  labName: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  status: z.string().nullable(),
})

export const activeActivitySchema = z.object({
  activityId: z.string(),
  scheduleId: z.string().nullable(),
  labId: z.string(),
  labName: z.string(),
  status: z.string(),
  timeIn: z.iso.datetime().nullable(),
  timeOut: z.iso.datetime().nullable(),
})

export const teacherDashboardQuerySchema = z.object({
  teacherId: z.string().openapi({
    param: {
      name: 'teacherId',
      in: 'query',
    },
    example: 'teacher123',
    description: 'Teacher ID to retrieve dashboard data for',
  }),
  start: z.iso.datetime().optional().openapi({
    param: {
      name: 'start',
      in: 'query',
    },
    example: '2025-01-01T00:00:00Z',
    description: 'Start date for schedule filtering (ISO 8601 format, optional)',
  }),
  end: z.iso.datetime().optional().openapi({
    param: {
      name: 'end',
      in: 'query',
    },
    example: '2025-12-31T23:59:59Z',
    description: 'End date for schedule filtering (ISO 8601 format, optional)',
  }),
})

export const teacherDashboardResponseSchema = z.object({
  schedules: z.array(scheduleWithDetailsSchema),
  activeActivity: activeActivitySchema.nullable(),
})
