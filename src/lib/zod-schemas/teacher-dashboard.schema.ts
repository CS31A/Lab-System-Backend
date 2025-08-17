import { z } from '@hono/zod-openapi'

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

export const currentLabSessionSchema = z.object({
  labSessionId: z.string(),
  scheduleId: z.string().nullable(),
  labId: z.string(),
  labName: z.string(),
  status: z.string(),
  sessionStartTime: z.iso.datetime().nullable(),
  sessionEndTime: z.iso.datetime().nullable(),
})

export const teacherDashboardQuerySchema = z.object({
  teacherId: z.string()
    .min(1, 'Teacher ID cannot be empty')
    .max(50, 'Teacher ID too long')
    .trim()
    .regex(/^\w+$/, 'Teacher ID can only contain letters, numbers, and underscores')
    .openapi({
      param: {
        name: 'teacherId',
        in: 'query',
      },
      example: 'teacher123',
      description: 'Teacher ID to retrieve dashboard data for (required)',
    }),
  start: z.iso.datetime()
    .optional()
    .openapi({
      param: {
        name: 'start',
        in: 'query',
      },
      example: '2025-01-01T00:00:00Z',
      description: 'Start date for schedule filtering (ISO 8601 format, optional)',
    }),
  end: z.iso.datetime()
    .optional()
    .openapi({
      param: {
        name: 'end',
        in: 'query',
      },
      example: '2025-12-31T23:59:59Z',
      description: 'End date for schedule filtering (ISO 8601 format, optional)',
    }),
})
// Prevent extreme future/past dates
  .refine(
    (data) => {
      if (data.start && data.end) {
        const startDate = new Date(data.start)
        const endDate = new Date(data.end)

        // Validate dates are valid
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          return false
        }

        return startDate <= endDate
      }
      return true
    },
    {
      message: 'Start date must be before or equal to end date and both dates must be valid',
      path: ['start'],
    },
  )
  // Date range cannot exceed 365 days
  .refine(
    (data) => {
      if (data.start && data.end) {
        const startDate = new Date(data.start)
        const endDate = new Date(data.end)
        // Validate dates are valid first
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          return false
        }
        // Use UTC calendar days to avoid floating-point issues
        const startUTC = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
        const endUTC = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())

        const daysDiff = Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24))
        return daysDiff <= 365
      }
      return true
    },
    {
      message: 'Date range cannot exceed 365 days',
      path: ['end'],
    },
  )

export const teacherDashboardResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    schedules: z.array(scheduleWithDetailsSchema),
    currentLabSession: currentLabSessionSchema.nullable(),
  }),
})
