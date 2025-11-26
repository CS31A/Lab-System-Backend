import { createRoute, z } from '@hono/zod-openapi'
import { teacherSelectSchema } from '@/db/schema'
import {
  labAvailabilityResponseSchema,
  labSchedulesResponseSchema,
  pagination,
  paginationQuery,
  teacherDashboardQuerySchema,
  teacherDashboardResponseSchema,
} from '@/lib/zod-schemas'
import { errorSchema } from '@/lib/zod-schemas/error.schema'

import jsonContent from '@/middleware/utils/json-content'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Route definition for getting teacher dashboard data
 * @description Retrieves dashboard information for a teacher based on query parameters
 */
export const getTeacherDashboardRoute = createRoute({
  tags: ['Teachers'],
  method: 'get',
  path: '/teachers/dashboard',
  request: {
    query: teacherDashboardQuerySchema,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      teacherDashboardResponseSchema,
      'Teacher dashboard data retrieved successfully',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      'Invalid query parameters',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting a list of teachers with pagination
 * @description Retrieves a paginated list of teachers
 */
export const getTeachersRoute = createRoute({
  tags: ['Teachers'],
  method: 'get',
  path: '/teachers',
  request: {
    query: paginationQuery,
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(teacherSelectSchema),
        pagination,
      }),
      'List of teachers retrieved successfully',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      'Invalid query parameters',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      errorSchema,
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting laboratories assigned to a teacher
 * @description Retrieves laboratories with their current status for a teacher
 */
export const getTeacherLaboratoriesRoute = createRoute({
  tags: ['Teachers'],
  method: 'get',
  path: '/teachers/laboratories',
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            status: z.boolean(),
            vacancy_status: z.enum(['available', 'occupied', 'maintenance']),
            current_schedule: z.object({
              id: z.string(),
              section: z.string(),
              start_time: z.string(),
              end_time: z.string(),
              subject_name: z.string(),
              teacher_name: z.string(),
            }).nullable(),
            created_at: z.string(),
            updated_at: z.string(),
          }),
        ),
      }),
      'Laboratories with current status retrieved successfully',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for getting schedules for a specific laboratory
 * @description Retrieves all schedules for a given laboratory by ID
 */
export const getLabScheduleRoute = createRoute({
  tags: ['Teachers'],
  method: 'get',
  path: '/teachers/laboratories/{labId}/schedule',
  request: {
    params: z.object({
      labId: z
        .string()
        .trim()
        .min(1, 'labId is required')
        .openapi({
          param: {
            name: 'labId',
            in: 'path',
            required: true,
          },
          example: 'lab123456789',
        }),
    }),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      labSchedulesResponseSchema,
      'Laboratory schedules retrieved successfully',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      'Invalid labId parameter',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Laboratory not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for checking laboratory availability
 * @description Checks if a laboratory is currently available or occupied
 */
export const getLabAvailabilityRoute = createRoute({
  tags: ['Teachers'],
  method: 'get',
  path: '/teachers/laboratories/{labId}/availability',
  request: {
    params: z.object({
      labId: z
        .string()
        .trim()
        .min(1, 'labId is required')
        .openapi({
          param: {
            name: 'labId',
            in: 'path',
            required: true,
          },
          example: 'lab123456789',
        }),
    }),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      labAvailabilityResponseSchema,
      'Laboratory availability checked successfully',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      errorSchema,
      'Invalid labId parameter',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Laboratory not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Internal Server Error',
    ),
  },
})

export const getScheduleStudentsRoute = createRoute({
  tags: ['Teachers'],
  method: 'get',
  path: '/teachers/schedules/{scheduleId}/students',
  request: {
    params: z.object({
      scheduleId: z
        .string()
        .trim()
        .min(1, 'scheduleId is required')
        .openapi({
          param: {
            name: 'scheduleId',
            in: 'path',
            required: true,
          },
          example: 'sched1234567',
        }),
    }),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.array(
          z.object({
            seating_plan_id: z.string(),
            student_id: z.string(),
            firstname: z.string(),
            lastname: z.string(),
            student_number: z.string(),
            section: z.string(),
            course: z.string(),
            seat_number: z.string(),
            monitor_status: z.string(),
            mouse_status: z.string(),
            keyboard_status: z.string(),
            cables_status: z.string(),
          }),
        ),
      }),
      'Schedule students retrieved successfully',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Schedule not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for adding students to a schedule
 * @description Adds one or more students to a specific schedule
 */
export const addScheduleStudentsRoute = createRoute({
  tags: ['Teachers'],
  method: 'post',
  path: '/teachers/schedules/{scheduleId}/students',
  request: {
    params: z.object({
      scheduleId: z
        .string()
        .trim()
        .min(1, 'scheduleId is required')
        .openapi({
          param: {
            name: 'scheduleId',
            in: 'path',
            required: true,
          },
          example: 'sched1234567',
        }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            students: z.array(
              z.object({
                student_id: z.string().min(1, 'student_id is required'),
                seat_number: z.string().min(1, 'seat_number is required'),
                monitor_status: z.string().default('Good condition'),
                mouse_status: z.string().default('Good condition'),
                keyboard_status: z.string().default('Good condition'),
                cables_status: z.string().default('Good condition'),
              }),
            ).min(1, 'At least one student is required'),
          }),
        },
      },
    },
  },
  responses: {
    [httpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        data: z.object({
          added_count: z.number(),
          seating_plans: z.array(z.any()),
        }),
      }),
      'Students added to schedule successfully',
    ),
    [httpStatusCodes.BAD_REQUEST]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Bad Request',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Schedule not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for updating a student in a schedule
 * @description Updates a student's seating information in a specific schedule
 */
export const updateScheduleStudentRoute = createRoute({
  tags: ['Teachers'],
  method: 'put',
  path: '/teachers/schedules/{scheduleId}/students/{studentId}',
  request: {
    params: z.object({
      scheduleId: z
        .string()
        .trim()
        .min(1, 'scheduleId is required')
        .openapi({
          param: {
            name: 'scheduleId',
            in: 'path',
            required: true,
          },
          example: 'sched1234567',
        }),
      studentId: z
        .string()
        .trim()
        .min(1, 'studentId is required')
        .openapi({
          param: {
            name: 'studentId',
            in: 'path',
            required: true,
          },
          example: 'student12345',
        }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            seat_number: z.string().optional(),
            monitor_status: z.string().optional(),
            mouse_status: z.string().optional(),
            keyboard_status: z.string().optional(),
            cables_status: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        data: z.any(),
      }),
      'Student updated in schedule successfully',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Schedule or student not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Internal Server Error',
    ),
  },
})

/**
 * Route definition for removing a student from a schedule
 * @description Removes a student from a specific schedule
 */
export const removeScheduleStudentRoute = createRoute({
  tags: ['Teachers'],
  method: 'delete',
  path: '/teachers/schedules/{scheduleId}/students/{studentId}',
  request: {
    params: z.object({
      scheduleId: z
        .string()
        .trim()
        .min(1, 'scheduleId is required')
        .openapi({
          param: {
            name: 'scheduleId',
            in: 'path',
            required: true,
          },
          example: 'sched1234567',
        }),
      studentId: z
        .string()
        .trim()
        .min(1, 'studentId is required')
        .openapi({
          param: {
            name: 'studentId',
            in: 'path',
            required: true,
          },
          example: 'student12345',
        }),
    }),
  },
  responses: {
    [httpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Student removed from schedule successfully',
    ),
    [httpStatusCodes.NOT_FOUND]: jsonContent(
      z.object({
        message: z.string(),
      }),
      'Schedule or student not found',
    ),
    [httpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      z.object({
        message: z.string(),
        errors: z.any(),
      }),
      'Internal Server Error',
    ),
  },
})

/**
 * @typedef {typeof getScheduleStudentsRoute} GetScheduleStudentsRoute
 * @description Type definition for the get schedule students route
 */
export type GetScheduleStudentsRoute = typeof getScheduleStudentsRoute

/**
 * @typedef {typeof addScheduleStudentsRoute} AddScheduleStudentsRoute
 * @description Type definition for the add schedule students route
 */
export type AddScheduleStudentsRoute = typeof addScheduleStudentsRoute

/**
 * @typedef {typeof updateScheduleStudentRoute} UpdateScheduleStudentRoute
 * @description Type definition for the update schedule student route
 */
export type UpdateScheduleStudentRoute = typeof updateScheduleStudentRoute

/**
 * @typedef {typeof removeScheduleStudentRoute} RemoveScheduleStudentRoute
 * @description Type definition for the remove schedule student route
 */
export type RemoveScheduleStudentRoute = typeof removeScheduleStudentRoute

/**
 * @typedef {typeof getTeachersRoute} GetTeachers
 * @description Type definition for the get teachers route
 */
export type GetTeachers = typeof getTeachersRoute

/**
 * @typedef {typeof getTeacherDashboardRoute} GetTeacherDashboard
 * @description Type definition for the get teacher dashboard route
 */
export type GetTeacherDashboard = typeof getTeacherDashboardRoute

/**
 * @typedef {typeof getTeacherLaboratoriesRoute} GetTeacherLaboratories
 * @description Type definition for the get teacher laboratories route
 */
export type GetTeacherLaboratories = typeof getTeacherLaboratoriesRoute

/**
 * @typedef {typeof getLabScheduleRoute} GetLabSchedule
 * @description Type definition for the get lab schedule route
 */
export type GetLabSchedule = typeof getLabScheduleRoute

/**
 * @typedef {typeof getLabAvailabilityRoute} GetLabAvailability
 * @description Type definition for the get lab availability route
 */
export type GetLabAvailability = typeof getLabAvailabilityRoute

/**
 * Route definition for getting students in a schedule
 * @description Retrieves all students enrolled in a specific schedule
 */
