/**
 * @fileoverview Get Lab Availability handler - checks if a laboratory is currently available
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetLabAvailability } from '@/routes/teachers/teachers.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TeacherService } from '@/services/TeacherService'

/**
 * Checks the availability status of a specific laboratory
 */
export const GetLabAvailabilityHandler: AppRouteHandler<GetLabAvailability> = async (c) => {
  const { labId } = c.req.valid('param')

  try {
    const teacherService = new TeacherService(c)
    const availability = await teacherService.getLabAvailability(labId)

    return c.json(
      {
        message: 'Laboratory availability checked successfully',
        data: availability,
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

    c.var.logger.error('Failed to check laboratory availability', {
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
