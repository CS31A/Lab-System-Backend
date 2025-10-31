/**
 * @fileoverview Shared type definitions for test helpers
 * Common interfaces and types used across test files
 */

/**
 * Interface for route parameter data in tests
 * Used to represent URL parameters (e.g., /schedules/:id)
 */
export interface ParamData {
  id: string
}

/**
 * Interface for schedule data used in create and update operations in tests
 * Fields are optional to support both partial updates and full creates
 */
export interface ScheduleSchemaData {
  laboratory_id?: string
  teacher_id?: string
  subject_id?: string
  section?: string
  start_time?: Date
  end_time?: Date
  status?: string | null
}
