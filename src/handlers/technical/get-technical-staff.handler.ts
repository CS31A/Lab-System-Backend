/**
 * @fileoverview Technical staff retrieval handler - delegates to TechnicalStaffService for business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetTechnicalStaff } from '@/routes/technical/technical.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TechnicalStaffService } from '@/services/TechnicalStaffService'

/**
 * Retrieves paginated list of technical staff from the database.
 * Delegates business logic to TechnicalStaffService for better separation of concerns.
 */
export const GetTechnicalStaffHandler: AppRouteHandler<GetTechnicalStaff> = async (c) => {
  try {
    // Parse and validate query parameters
    const { page, limit } = c.req.valid('query')

    const technicalStaffService = new TechnicalStaffService(c)
    const { technicalStaff, pagination } = await technicalStaffService.listTechnicalStaff({ page, limit })

    return c.json(
      {
        message: 'List of technical staff retrieved successfully',
        data: technicalStaff,
        pagination,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    // Log error with context for debugging
    c.var.logger.error('Failed to retrieve technical staff', {
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred while retrieving technical staff',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
