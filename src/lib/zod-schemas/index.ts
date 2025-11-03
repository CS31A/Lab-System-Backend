/**
 * @fileoverview Export module for all Zod schemas
 * This file serves as the central export point for all Zod schema definitions
 * used throughout the application, organized by feature area.
 */

/**
 * @module Auth Schemas
 * Export schemas related to authentication and authorization functionality
 */
export {
  basicMessageResponseSchema,
  errorResponseSchema,
  jwtPayloadSchema,
  loginBodySchema,
  loginResponseSchema,
  meDataSchema,
  unauthorizedResponseSchema,
} from './auth.schema'

/**
 * @module Pagination Schemas
 * Export schemas related to pagination functionality
 */
export {
  pagination,
  paginationQuery,
} from './pagination.schema'

/**
 * @module Teacher Dashboard Schemas
 * Export schemas related to teacher dashboard functionality
 */
export {
  teacherDashboardQuerySchema,
  teacherDashboardResponseSchema,
} from './teacher-dashboard.schema'

/**
 * @module Teacher Labs Schemas
 * Export schemas related to teacher laboratory functionality
 */
export {
  currentScheduleSchema,
  labAvailabilityDataSchema,
  labAvailabilityResponseSchema,
  laboratorySchema,
  laboratoryWithStatusSchema,
  labScheduleSchema,
  labSchedulesResponseSchema,
  subjectMinimalSchema,
  subjectSchema,
  teacherMinimalSchema,
  teacherSchema,
} from './teacher-labs.schema'
