/**
 * @fileoverview Student handlers - delegates to StudentService for business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type {
 CreateStudentRoute,
  GetAllStudentsRoute,
  GetAllStudentsNoPaginationRoute,
  GetStudentRoute,
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