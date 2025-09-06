/**
 * @fileoverview Subject handlers - delegates to SubjectService for business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type {
  CreateSubjectRoute,
  DeleteSubjectRoute,
  GetAllSubjectsRoute,
  GetSubjectRoute,
  ListSubjectsRoute,
  UpdateSubjectRoute,
} from '@/routes/subjects/subjects.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { SubjectService } from '@/services/SubjectService'

/**
 * Creates a new subject
 */
export const CreateSubjectHandler: AppRouteHandler<CreateSubjectRoute> = async (c) => {
  const validatedBody = c.req.valid('json')

  try {
    const subjectService = new SubjectService(c)
    const createdSubject = await subjectService.createSubject(validatedBody)

    return c.json(
      {
        message: 'Subject created successfully',
        data: createdSubject,
      },
      httpStatusCodes.CREATED,
    )
  }
  catch (err) {
    c.var.logger.error('Subject creation failed', {
      error: (err as Error).message,
      subjectData: validatedBody,
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
 * Retrieves a subject by ID
 */
export const GetSubjectHandler: AppRouteHandler<GetSubjectRoute> = async (c) => {
  const { id } = c.req.valid('param')

  try {
    const subjectService = new SubjectService(c)
    const subject = await subjectService.getSubjectById(id)

    if (!subject) {
      return c.json(
        {
          message: 'Subject not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    return c.json(
      {
        message: 'Subject retrieved successfully',
        data: subject,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve subject', {
      error: (err as Error).message,
      subjectId: id,
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
 * Updates a subject by ID
 */
export const UpdateSubjectHandler: AppRouteHandler<UpdateSubjectRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const validatedBody = c.req.valid('json')

  try {
    const subjectService = new SubjectService(c)
    const updatedSubject = await subjectService.updateSubject(id, validatedBody)

    return c.json(
      {
        message: 'Subject updated successfully',
        data: updatedSubject,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    if (err instanceof Error && err.message === 'Subject not found') {
      return c.json(
        {
          message: 'Subject not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    c.var.logger.error('Subject update failed', {
      error: (err as Error).message,
      subjectId: id,
      updateData: validatedBody,
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
 * Deletes a subject by ID
 */
export const DeleteSubjectHandler: AppRouteHandler<DeleteSubjectRoute> = async (c) => {
  const { id } = c.req.valid('param')

  try {
    const subjectService = new SubjectService(c)
    await subjectService.deleteSubject(id)

    return c.json(
      {
        message: 'Subject deleted successfully',
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    if (err instanceof Error && err.message === 'Subject not found') {
      return c.json(
        {
          message: 'Subject not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    c.var.logger.error('Subject deletion failed', {
      error: (err as Error).message,
      subjectId: id,
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
 * Lists subjects with pagination
 */
export const ListSubjectsHandler: AppRouteHandler<ListSubjectsRoute> = async (c) => {
  const { page = 1, limit = 10 } = c.req.valid('query')

  try {
    const subjectService = new SubjectService(c)
    const result = await subjectService.listSubjects({ page, limit })

    return c.json(
      {
        message: 'Subjects retrieved successfully',
        data: result.subjects,
        pagination: result.pagination,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve subjects list', {
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
 * Retrieves all subjects without pagination
 */
export const GetAllSubjectsHandler: AppRouteHandler<GetAllSubjectsRoute> = async (c) => {
  try {
    const subjectService = new SubjectService(c)
    const subjects = await subjectService.getAllSubjects()

    return c.json(
      {
        message: 'All subjects retrieved successfully',
        data: subjects,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve all subjects', {
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
