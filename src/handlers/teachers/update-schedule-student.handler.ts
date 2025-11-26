/**
 * @fileoverview Handler for updating a student's information in a teacher's schedule
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { UpdateScheduleStudentRoute } from '@/routes/teachers/teachers.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TeacherService } from '@/services/TeacherService'

/**
 * Updates a student's seating plan information within a specific schedule
 * Can modify seat number and equipment status
 */
export const UpdateScheduleStudentHandler: AppRouteHandler<UpdateScheduleStudentRoute> = async (c) => {
  try {
    const { scheduleId, studentId } = c.req.valid('param')
    const data = c.req.valid('json')

    const teacherService = new TeacherService(c)
    const result = await teacherService.updateStudentInSchedule(scheduleId, studentId, data)

    return c.json(
      {
        message: 'Student updated in schedule successfully',
        data: result,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const error = err as Error
    c.var.logger.error('Failed to update student in schedule', {
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
