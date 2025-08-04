/**
 * @fileoverview Teachers retrieval handler - delegates to TeacherService for business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetTeachers } from '@/routes/teachers/teachers.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { TeacherService } from '@/services/TeacherService'

/**
 * Retrieves paginated list of teachers from the database.
 * Delegates business logic to TeacherService for better separation of concerns.
 */
export const GetTeachersHandler: AppRouteHandler<GetTeachers> = async (c) => {
  try {
    // Parse and validate query parameters
    const { page, limit } = c.req.valid('query')
    
    const teacherService = new TeacherService(c)
    const { teachers, pagination } = await teacherService.listTeachers({ page, limit })

    return c.json(
      {
        message: 'List of teachers retrieved successfully',
        data: teachers,
        pagination,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    // Log error with context for debugging
    c.var.logger.error('Failed to retrieve teachers', {
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
