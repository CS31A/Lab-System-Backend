/**
 * @fileoverview Teacher laboratory schema definitions for API responses
 * Defines shared schema structures for laboratory schedules and related entities
 */

import { z } from '@hono/zod-openapi'

/**
 * Zod schema for subject information
 *
 * @description Represents basic subject information
 *
 * @property {string} id - Unique identifier for the subject
 * @property {string} name - Name of the subject
 * @property {string} code - Code of the subject
 */
export const subjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
})

/**
 * Zod schema for teacher information
 *
 * @description Represents basic teacher information
 *
 * @property {string} id - Unique identifier for the teacher
 * @property {string|null} firstname - First name of the teacher (nullable)
 * @property {string|null} lastname - Last name of the teacher (nullable)
 */
export const teacherSchema = z.object({
  id: z.string(),
  firstname: z.string().nullable(),
  lastname: z.string().nullable(),
})

/**
 * Zod schema for laboratory information
 *
 * @description Represents basic laboratory information
 *
 * @property {string} id - Unique identifier for the laboratory
 * @property {string} name - Name of the laboratory
 */
export const laboratorySchema = z.object({
  id: z.string(),
  name: z.string(),
})

/**
 * Zod schema for laboratory schedule with full details
 *
 * @description Represents a complete laboratory schedule with subject, teacher, and lab information
 *
 * @property {string} id - Unique identifier for the schedule
 * @property {string} section - Class section for the schedule
 * @property {Date} start_time - Start time of the schedule
 * @property {Date} end_time - End time of the schedule
 * @property {string|null} status - Current status of the schedule (nullable)
 * @property {Date} created_at - Timestamp when the schedule was created
 * @property {Date} updated_at - Timestamp when the schedule was last updated
 * @property {object} subject - Subject information
 * @property {object} teacher - Teacher information
 * @property {object} laboratory - Laboratory information
 */
export const labScheduleSchema = z.object({
  id: z.string(),
  section: z.string(),
  start_time: z.date(),
  end_time: z.date(),
  status: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  subject: subjectSchema,
  teacher: teacherSchema,
  laboratory: laboratorySchema,
})

/**
 * Zod schema for laboratory schedules response
 *
 * @description Response schema for laboratory schedules endpoint
 *
 * @property {string} message - Response message
 * @property {Array} data - Array of laboratory schedules
 */
export const labSchedulesResponseSchema = z.object({
  message: z.string(),
  data: z.array(labScheduleSchema),
})

/**
 * Zod schema for simplified subject information
 *
 * @description Represents minimal subject information for availability checks
 *
 * @property {string} name - Name of the subject
 * @property {string} code - Code of the subject
 */
export const subjectMinimalSchema = z.object({
  name: z.string(),
  code: z.string(),
})

/**
 * Zod schema for simplified teacher information
 *
 * @description Represents minimal teacher information for availability checks
 *
 * @property {string} name - Full name of the teacher
 */
export const teacherMinimalSchema = z.object({
  name: z.string(),
})

/**
 * Zod schema for current schedule information
 *
 * @description Represents the current schedule during availability check
 *
 * @property {string} id - Unique identifier for the schedule
 * @property {string} section - Class section for the schedule
 * @property {string} start_time - Start time of the schedule in ISO format
 * @property {string} end_time - End time of the schedule in ISO format
 * @property {string|null} status - Current status of the schedule (nullable)
 * @property {object} subject - Minimal subject information
 * @property {object} teacher - Minimal teacher information
 */
export const currentScheduleSchema = z.object({
  id: z.string(),
  section: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.string().nullable(),
  subject: subjectMinimalSchema,
  teacher: teacherMinimalSchema,
})

/**
 * Zod schema for laboratory with status
 *
 * @description Represents laboratory information with operational status
 *
 * @property {string} id - Unique identifier for the laboratory
 * @property {string} name - Name of the laboratory
 * @property {boolean|null} status - Operational status of the laboratory (nullable)
 */
export const laboratoryWithStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.boolean().nullable(),
})

/**
 * Zod schema for laboratory availability data
 *
 * @description Complete availability information for a laboratory
 *
 * @property {object} laboratory - Laboratory information with status
 * @property {boolean} is_available - Whether the laboratory is currently available
 * @property {string} availability_status - Current availability status enum
 * @property {object|null} current_schedule - Current schedule if occupied (nullable)
 * @property {string} checked_at - Timestamp when availability was checked
 */
export const labAvailabilityDataSchema = z.object({
  laboratory: laboratoryWithStatusSchema,
  is_available: z.boolean(),
  availability_status: z.enum(['available', 'occupied', 'maintenance']),
  current_schedule: currentScheduleSchema.nullable(),
  checked_at: z.string(),
})

/**
 * Zod schema for laboratory availability response
 *
 * @description Response schema for laboratory availability endpoint
 *
 * @property {string} message - Response message
 * @property {object} data - Availability data
 */
export const labAvailabilityResponseSchema = z.object({
  message: z.string(),
  data: labAvailabilityDataSchema,
})
