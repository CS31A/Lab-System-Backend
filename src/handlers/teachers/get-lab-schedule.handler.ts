/**
 * @fileoverview Get Lab Schedule handler - retrieves all schedules for a specific laboratory
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetLabSchedule } from '@/routes/teachers/teachers.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TeacherService } from '@/services/TeacherService'

/**
 * Retrieves all schedules for a specific laboratory
 */
export const GetLabScheduleHandler: AppRouteHandler<GetLabSchedule> = async (c) => {
  const { labId } = c.req.valid('param')

  try {
    const teacherService = new TeacherService(c)
    const schedules = await teacherService.getLabScheduleById(labId)

    return c.json(
      {
        message: 'Laboratory schedules retrieved successfully',
        data: schedules,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    if (err instanceof Error && err.message === 'Laboratory not found') {
      return c.json(
        {
          message: 'Laboratory not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    c.var.logger.error('Failed to retrieve laboratory schedules', {
      error: (err as Error).message,
      laboratoryId: labId,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: (err as Error).message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
