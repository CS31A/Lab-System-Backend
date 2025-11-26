/**
 * @fileoverview Technical staff dashboard handler
 * Retrieves comprehensive dashboard data for technical staff including maintenance statistics
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetTechnicalStaffDashboard } from '@/routes/technical/technical.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TechnicalStaffService } from '@/services/TechnicalStaffService'

/**
 * Retrieves technical staff dashboard data including:
 * - Total laboratories and computers
 * - Functional vs. non-functional equipment counts
 * - Recent laboratory activities
 * - Maintenance tasks prioritized by urgency
 */
export const GetTechnicalStaffDashboardHandler: AppRouteHandler<GetTechnicalStaffDashboard> = async (c) => {
  try {
    // Parse and validate query parameters
    const { technicalStaffId } = c.req.valid('query')

    const technicalStaffService = new TechnicalStaffService(c)
    const dashboardData = await technicalStaffService.getTechnicalStaffDashboard({ technicalStaffId })

    return c.json(
      {
        message: 'Technical staff dashboard data retrieved successfully',
        data: dashboardData,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const errorMessage = (err as Error).message

    // Check if it's a not found error
    if (errorMessage.includes('does not exist')) {
      c.var.logger.warn('Technical staff not found', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      })

      return c.json(
        {
          message: 'Technical staff not found',
          errors: errorMessage,
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    // Log error with context for debugging
    c.var.logger.error('Failed to retrieve technical staff dashboard data', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred while retrieving dashboard data',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
