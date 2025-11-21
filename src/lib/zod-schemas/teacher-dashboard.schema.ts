/**
 * @fileoverview Teacher dashboard schema definitions for API responses
 * Defines the structure for teacher dashboard data throughout the application
 */

import { z } from '@hono/zod-openapi'

/**
 * Zod schema for schedule information with detailed subject and lab information
 *
 * @description Represents a teacher's schedule with associated subject and laboratory details
 *
 * @property {string} scheduleId - Unique identifier for the schedule
 * @property {string} labId - Unique identifier for the laboratory
 * @property {string} subjectCode - Code of the subject being taught
 * @property {string} subjectName - Name of the subject being taught
 * @property {string} section - Class section for the schedule
 * @property {string} labName - Name of the laboratory where the class is held
 * @property {string} startTime - Start time of the schedule in ISO 8601 format
 * @property {string} endTime - End time of the schedule in ISO 8601 format
 * @property {string|null} status - Current status of the schedule (nullable)
 */
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

/**
 * Zod schema for current laboratory session information
 *
 * @description Represents the current laboratory session for a teacher
 *
 * @property {string} labSessionId - Unique identifier for the laboratory session
 * @property {string|null} scheduleId - Unique identifier for the associated schedule (nullable)
 * @property {string} labId - Unique identifier for the laboratory
 * @property {string} labName - Name of the laboratory
 * @property {string} status - Current status of the laboratory session
 * @property {string|null} sessionStartTime - Start time of the session in ISO 8601 format (nullable)
 * @property {string|null} sessionEndTime - End time of the session in ISO 8601 format (nullable)
 */
export const currentLabSessionSchema = z.object({
  labSessionId: z.string(),
  scheduleId: z.string().nullable(),
  labId: z.string(),
  labName: z.string(),
  status: z.string(),
  sessionStartTime: z.iso.datetime().nullable(),
  sessionEndTime: z.iso.datetime().nullable(),
})

/**
 * Zod schema for teacher dashboard query parameters
 *
 * @description Defines the query parameters required to retrieve teacher dashboard data
 *
 * @property {string} teacherId - The unique identifier of the teacher to retrieve dashboard data for
 * @property {string} [start] - Optional start date for schedule filtering in ISO 8601 format
 * @property {string} [end] - Optional end date for schedule filtering in ISO 8601 format
 *
 * @example
 * // Query: ?teacherId=teacher123&start=2025-01-01T00:00:00Z&end=2025-12-31T23:59:59Z
 * {
 *   teacherId: 'teacher123',
 *   start: '2025-01-01T00:00Z',
 *   end: '2025-12-31T23:59:59Z'
 * }
 */
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

/**
 * Zod schema for teacher dashboard response
 *
 * @description Defines the structure for the response returned by the teacher dashboard endpoint
 *
 * @property {string} message - A message providing information about the response
 * @property {object} data - The main data object containing dashboard information
 * @property {Array} data.schedules - Array of schedule objects with detailed information
 * @property {object|null} data.currentLabSession - Current laboratory session information (nullable)
 *
 * @example
 * {
 *   message: "Teacher dashboard data retrieved successfully",
 *   data: {
 *     schedules: [
 *       {
 *         scheduleId: "sched123",
 *         labId: "lab456",
 *         subjectCode: "CS101",
 *         subjectName: "Introduction to Computer Science",
 *         section: "A",
 *         labName: "Computer Lab 1",
 *         startTime: "2025-01-01T08:00:00.000Z",
 *         endTime: "2025-01-01T10:00:00.000Z",
 *         status: "active"
 *       }
 *     ],
 *     currentLabSession: {
 *       labSessionId: "session789",
 *       scheduleId: "sched123",
 *       labId: "lab456",
 *       labName: "Computer Lab 1",
 *       status: "active",
 *       sessionStartTime: "2025-01-01T08:00.000Z",
 *       sessionEndTime: null
 *     }
 *   }
 * }
 */
export const teacherDashboardResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    schedules: z.array(scheduleWithDetailsSchema),
    currentLabSession: currentLabSessionSchema.nullable(),
  }),
})
