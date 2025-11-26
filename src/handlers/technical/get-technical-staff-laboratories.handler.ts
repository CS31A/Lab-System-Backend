/**
 * @fileoverview Technical staff laboratories retrieval handler
 * Retrieves all laboratories with maintenance status for technical staff
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetTechnicalStaffLaboratories } from '@/routes/technical/technical.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TechnicalStaffService } from '@/services/TechnicalStaffService'

/**
 * Retrieves all laboratories with their current status and maintenance information
 * Includes equipment status (functional/non-functional computers) for technical staff
 */
export const GetTechnicalStaffLaboratoriesHandler: AppRouteHandler<GetTechnicalStaffLaboratories> = async (c) => {
  try {
    const technicalStaffService = new TechnicalStaffService(c)
    const laboratories = await technicalStaffService.getLaboratoriesWithMaintenanceStatus()

    return c.json(
      {
        message: 'Laboratories with maintenance status retrieved successfully',
        data: laboratories,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    // Log error with context for debugging
    c.var.logger.error('Failed to retrieve laboratories with maintenance status', {
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred while retrieving laboratories',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
