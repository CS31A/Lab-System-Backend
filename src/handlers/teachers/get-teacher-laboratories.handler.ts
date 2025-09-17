/**
 * @fileoverview Get Teacher Laboratories handler - retrieves all laboratories with vacancy status
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetTeacherLaboratories } from '@/routes/teachers/teachers.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TeacherService } from '@/services/TeacherService'

/**
 * Retrieves all laboratories with their current status
 */
export const GetTeacherLaboratoriesHandler: AppRouteHandler<GetTeacherLaboratories> = async (c) => {
  try {
    const teacherService = new TeacherService(c)
    const laboratories = await teacherService.getLaboratoriesWithCurrentStatus()

    return c.json(
      {
        message: 'Laboratories with current status retrieved successfully',
        data: laboratories,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve laboratories', {
      error: (err as Error).message,
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
