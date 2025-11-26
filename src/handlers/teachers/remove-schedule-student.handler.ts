/**
 * @fileoverview Handler for removing a student from a teacher's schedule
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { RemoveScheduleStudentRoute } from '@/routes/teachers/teachers.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TeacherService } from '@/services/TeacherService'

/**
 * Removes a student from a specific schedule
 * Deletes the associated seating plan entry
 */
export const RemoveScheduleStudentHandler: AppRouteHandler<RemoveScheduleStudentRoute> = async (c) => {
  try {
    const { scheduleId, studentId } = c.req.valid('param')

    const teacherService = new TeacherService(c)
    await teacherService.removeStudentFromSchedule(scheduleId, studentId)

    return c.json(
      {
        message: 'Student removed from schedule successfully',
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const error = err as Error
    c.var.logger.error('Failed to remove student from schedule', {
      error: error.message,
      timestamp: new Date().toISOString(),
    })

    if (error.message === 'Schedule not found' || error.message === 'Student not found in this schedule') {
      return c.json(
        {
          message: error.message,
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
