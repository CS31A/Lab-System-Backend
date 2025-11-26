/**
 * @fileoverview Handler for retrieving students in a teacher's schedule
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetScheduleStudentsRoute } from '@/routes/teachers/teachers.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TeacherService } from '@/services/TeacherService'

/**
 * Retrieves the list of students enrolled in a specific schedule
 * Validates that the schedule exists and belongs to the authenticated teacher
 */
export const GetScheduleStudentsHandler: AppRouteHandler<GetScheduleStudentsRoute> = async (c) => {
  try {
    const { scheduleId } = c.req.valid('param')

    const teacherService = new TeacherService(c)
    const students = await teacherService.getScheduleStudents(scheduleId)

    return c.json(
      {
        message: 'Schedule students retrieved successfully',
        data: students,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const error = err as Error
    c.var.logger.error('Failed to retrieve schedule students', {
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

    return c.json(
      {
        message: 'Internal Server Error',
        errors: error.message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
