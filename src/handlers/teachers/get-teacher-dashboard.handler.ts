/**
 * @fileoverview Teacher dashboard handler - delegates to TeacherService for business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetTeacherDashboard } from '@/routes/teachers/teachers.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TeacherService } from '@/services/TeacherService'

/**
 * Retrieves teacher dashboard data including schedules and active lab activities.
 * Delegates business logic to TeacherService for better separation of concerns.
 */
export const GetTeacherDashboardHandler: AppRouteHandler<GetTeacherDashboard> = async (c) => {
  try {
    // Parse and validate query parameters
    const { teacherId, start, end } = c.req.valid('query')

    const teacherService = new TeacherService(c)
    const dashboardData = await teacherService.getTeacherDashboard({
      teacherId,
      startDate: start ? new Date(start) : undefined,
      endDate: end ? new Date(end) : undefined,
    })

    return c.json(
      {
        message: 'Teacher dashboard data retrieved successfully',
        data: dashboardData,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    // Log error with context for debugging
    c.var.logger.error('Failed to retrieve teacher dashboard data', {
      error: (err as Error).message,
      teacherId: c.req.query('teacherId'),
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
