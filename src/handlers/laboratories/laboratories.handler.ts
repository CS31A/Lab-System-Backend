/**
 * @fileoverview Laboratory handlers - delegates to LaboratoryService for business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type {
  CreateLaboratoryRoute,
  DeleteLaboratoryRoute,
  GetAllLaboratoriesRoute,
  GetLaboratoryRoute,
  ListLaboratoriesRoute,
  UpdateLaboratoryRoute,
} from '@/routes/laboratories/laboratories.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { LaboratoryService } from '@/services/LaboratoryService'

/**
 * Creates a new laboratory
 */
export const CreateLaboratoryHandler: AppRouteHandler<CreateLaboratoryRoute> = async (c) => {
  const validatedBody = c.req.valid('json')

  try {
    const laboratoryService = new LaboratoryService(c)
    const createdLaboratory = await laboratoryService.createLaboratory(validatedBody)

    return c.json(
      {
        message: 'Laboratory created successfully',
        data: createdLaboratory,
      },
      httpStatusCodes.CREATED,
    )
  }
  catch (err) {
    c.var.logger.error('Laboratory creation failed', {
      error: (err as Error).message,
      laboratoryData: validatedBody,
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
 * Retrieves a laboratory by ID
 */
export const GetLaboratoryHandler: AppRouteHandler<GetLaboratoryRoute> = async (c) => {
  const { id } = c.req.valid('param')

  try {
    const laboratoryService = new LaboratoryService(c)
    const laboratory = await laboratoryService.getLaboratoryById(id)

    if (!laboratory) {
      return c.json(
        {
          message: 'Laboratory not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    return c.json(
      {
        message: 'Laboratory retrieved successfully',
        data: laboratory,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve laboratory', {
      error: (err as Error).message,
      laboratoryId: id,
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
 * Updates a laboratory by ID
 */
export const UpdateLaboratoryHandler: AppRouteHandler<UpdateLaboratoryRoute> = async (c) => {
  const { id } = c.req.valid('param')
  const validatedBody = c.req.valid('json')

  try {
    const laboratoryService = new LaboratoryService(c)
    const updatedLaboratory = await laboratoryService.updateLaboratory(id, validatedBody)

    return c.json(
      {
        message: 'Laboratory updated successfully',
        data: updatedLaboratory,
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

    c.var.logger.error('Laboratory update failed', {
      error: (err as Error).message,
      laboratoryId: id,
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
 * Deletes a laboratory by ID
 */
export const DeleteLaboratoryHandler: AppRouteHandler<DeleteLaboratoryRoute> = async (c) => {
  const { id } = c.req.valid('param')

  try {
    const laboratoryService = new LaboratoryService(c)
    await laboratoryService.deleteLaboratory(id)

    return c.json(
      {
        message: 'Laboratory deleted successfully',
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

    c.var.logger.error('Laboratory deletion failed', {
      error: (err as Error).message,
      laboratoryId: id,
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
 * Lists laboratories with pagination
 */
export const ListLaboratoriesHandler: AppRouteHandler<ListLaboratoriesRoute> = async (c) => {
  const { page = 1, limit = 10 } = c.req.valid('query')

  try {
    const laboratoryService = new LaboratoryService(c)
    const result = await laboratoryService.listLaboratories({ page, limit })

    return c.json(
      {
        message: 'Laboratories retrieved successfully',
        data: result.laboratories,
        pagination: result.pagination,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve laboratories list', {
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
 * Retrieves all laboratories without pagination
 */
export const GetAllLaboratoriesHandler: AppRouteHandler<GetAllLaboratoriesRoute> = async (c) => {
  try {
    const laboratoryService = new LaboratoryService(c)
    const laboratories = await laboratoryService.getAllLaboratories()

    return c.json(
      {
        message: 'All laboratories retrieved successfully',
        data: laboratories,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    c.var.logger.error('Failed to retrieve all laboratories', {
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
