/**
 * @fileoverview Student handlers - delegates to StudentService for business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type {
  CreateStudentRoute,
  GetAllStudentsNoPaginationRoute,
  GetAllStudentsRoute,
  GetStudentRoute,
  HardDeleteStudentRoute,
  SoftDeleteStudentRoute,
  UpdateStudentRoute,
} from '@/routes/students/students.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { StudentService } from '@/services/StudentService'

/**
 * Creates a new student
 */
export const CreateStudentHandler: AppRouteHandler<CreateStudentRoute> = async (c) => {
  const data = c.req.valid('json')

  try {
    const studentService = new StudentService(c)
    const newStudent = await studentService.createStudent(data)

    return c.json(
      {
        message: 'Student created successfully',
        data: newStudent,
      },
      httpStatusCodes.CREATED,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to create student', {
      error: (err as Error).message,
      studentData: data,
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

/**
 * Retrieves all students with pagination
 */
export const ListStudentsHandler: AppRouteHandler<GetAllStudentsRoute> = async (c) => {
  const { page = 1, limit = 10 } = c.req.valid('query')

  try {
    const studentService = new StudentService(c)
    const result = await studentService.listStudents({ page, limit })

    return c.json(
      {
        message: 'Students retrieved successfully',
        data: result.students,
        pagination: result.pagination,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve students list', {
      error: (err as Error).message,
      page,
      limit,
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

/**
 * Retrieves all students without pagination
 */
export const GetAllStudentsHandler: AppRouteHandler<GetAllStudentsNoPaginationRoute> = async (c) => {
  try {
    const studentService = new StudentService(c)
    const students = await studentService.getAllStudents()

    return c.json(
      {
        message: 'All students retrieved successfully',
        data: students,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve all students', {
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

/**
 * Retrieves a student by ID
 */
export const GetStudentHandler: AppRouteHandler<GetStudentRoute> = async (c) => {
  const { id } = c.req.valid('param')

  try {
    const studentService = new StudentService(c)
    const student = await studentService.getStudentById(id)

    if (!student) {
      return c.json(
        {
          message: 'Student not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    return c.json(
      {
        message: 'Student retrieved successfully',
        data: student,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve student', {
      error: (err as Error).message,
      studentId: id,
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

/**
 * Updates an existing student's information
 * Handles student profile updates and delegates business logic to StudentService
 */
export const UpdateStudentHandler: AppRouteHandler<UpdateStudentRoute> = async (c) => {
  // Extract validated path parameter and request body
  const { id: studentId } = c.req.valid('param')
  const { ...updateData } = c.req.valid('json')

  try {
    const studentService = new StudentService(c)

    // Call the update service with the student ID and update data
    const updatedStudent = await studentService.updateStudent(studentId, updateData)

    return c.json(
      {
        message: 'Student updated successfully',
        data: updatedStudent,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const errorMessage = (err as Error).message

    // Handle specific error cases
    if (errorMessage === 'Student not found') {
      c.var.logger.warn('Student update failed - student not found', {
        student_id: studentId,
        timestamp: new Date().toISOString(),
      })

      return c.json(
        {
          message: 'Student not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    // Log error with context for debugging
    c.var.logger.error('Student update failed', {
      error: errorMessage,
      student_id: studentId,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred during student update',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}

/**
 * Soft deletes a student by marking them as deleted without removing from database
 * This operation can be reversed using a restore endpoint if available
 *
 * @param c - The Hono context object containing the validated request parameters
 * @returns A JSON response indicating success or failure of the soft delete operation
 */
export const SoftDeleteStudentHandler: AppRouteHandler<SoftDeleteStudentRoute> = async (c) => {
  const { id: studentId } = c.req.valid('param')

  try {
    const studentService = new StudentService(c)
    const student = await studentService.softDeleteStudent(studentId)

    return c.json(
      {
        message: 'Student soft-deleted successfully',
        data: student,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    if (errorMessage === 'Student not found') {
      return c.json(
        { message: 'Student not found' },
        httpStatusCodes.NOT_FOUND,
      )
    }

    c.var.logger.error('Student soft delete failed', {
      error: errorMessage,
      student_id: studentId,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred while soft deleting the student',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}

/**
 * Permanently deletes a student and all associated data from the database.
 * This operation is irreversible and should be used with extreme caution.
 *
 * The handler performs the following operations:
 * 1. Validates the student ID parameter
 * 2. Delegates to StudentService for the hard delete operation
 * 3. Handles errors appropriately (student not found, database errors)
 * 4. Returns success response when deletion is complete
 * 5. Logs the operation for auditing purposes
 *
 * @param c - Hono context containing validated request parameters
 * @returns JSON response indicating success or failure of the operation
 *
 * @example
 * DELETE /students/123
 * Response: { "message": "Student permanently deleted successfully" }
 */
export const HardDeleteStudentHandler: AppRouteHandler<
  HardDeleteStudentRoute
> = async (c) => {
  // Extract validated student ID from request parameters
  const { id: studentId } = c.req.valid('param')

  try {
    const studentService = new StudentService(c)

    // Perform the hard delete operation
    await studentService.hardDeleteStudent(studentId)

    // Log successful deletion for auditing
    c.var.logger.info('Student hard delete operation completed', {
      student_id: studentId,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Student permanently deleted successfully',
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const error = err as Error

    // Handle specific error cases
    if (error.message === 'Student not found') {
      c.var.logger.warn('Hard delete attempted on non-existent student', {
        student_id: studentId,
        timestamp: new Date().toISOString(),
      })

      return c.json(
        {
          message: 'Student not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    // Log unexpected errors with context for debugging
    c.var.logger.error('Hard delete operation failed', {
      student_id: studentId,
      error: error.message,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred during student deletion',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
