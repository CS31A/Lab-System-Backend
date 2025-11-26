/**
 * @fileoverview Handler for adding students to a teacher's schedule
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { AddScheduleStudentsRoute } from '@/routes/teachers/teachers.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TeacherService } from '@/services/TeacherService'

/**
 * Adds one or more students to a specific schedule
 * Creates seating plan entries for each student
 */
export const AddScheduleStudentsHandler: AppRouteHandler<AddScheduleStudentsRoute> = async (c) => {
  try {
    const { scheduleId } = c.req.valid('param')
    const data = c.req.valid('json')

    const teacherService = new TeacherService(c)
    const result = await teacherService.addStudentsToSchedule(scheduleId, data)

    return c.json(
      {
        message: 'Students added to schedule successfully',
        data: result,
      },
      httpStatusCodes.CREATED,
    )
  }
  catch (err) {
    const error = err as Error
    c.var.logger.error('Failed to add students to schedule', {
      error: error.message,
      timestamp: new Date().toISOString(),
    })

    if (error.message === 'Schedule not found') {
      return c.json(
        {
          message: 'Schedule not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    if (error.message.includes('already enrolled') || error.message.includes('not found')) {
      return c.json(
        {
          message: 'Bad Request',
          errors: error.message,
        },
        httpStatusCodes.BAD_REQUEST,
      )
    }

    return c.json(
      {
        message: 'Internal Server Error',
        errors: error.message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
