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
 * Handler for creating a new laboratory.
 *
 * This handler processes POST requests to create a new laboratory record.
 * It validates the request body using Zod schema, delegates the creation
 * logic to LaboratoryService, and returns appropriate responses.
 *
 * @param c - The Hono context containing request and response objects
 * @param c.req.valid - Validates the request body using Zod schema
 * @param c.req.valid('json') - Extracts and validates the laboratory data from request body
 * @param c.json - Sends JSON response with created laboratory data or error message
 * @returns A Promise resolving to a Hono response object containing created laboratory or error
 *
 * @example
 * // Example usage in route:
 * // POST /laboratories { name: "Chemistry Lab", location: "Building A" }
 * // Response: { message: 'Laboratory created successfully', data: {...} }
 *
 * @throws {500} When an internal server error occurs
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
 * Handler for retrieving a laboratory by ID.
 *
 * This handler processes GET requests to retrieve a specific laboratory by its ID.
 * It validates the request parameters using Zod schema, delegates the retrieval
 * logic to LaboratoryService, handles cases where the laboratory is not found,
 * and returns appropriate responses.
 *
 * @param c - The Hono context containing request and response objects
 * @param c.req.valid - Validates the request parameters using Zod schema
 * @param c.req.valid('param') - Extracts the laboratory ID from URL parameters
 * @param c.json - Sends JSON response with laboratory data or error message
 * @returns A Promise resolving to a Hono response object containing laboratory data or error
 *
 * @example
 * // Example usage in route:
 * // GET /laboratories/:id
 * // Response: { message: 'Laboratory retrieved successfully', data: {...} }
 *
 * @throws {404} When laboratory is not found
 * @throws {500} When an internal server error occurs
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
 * Handler for updating a laboratory by ID.
 *
 * This handler processes PATCH requests to update an existing laboratory by its ID.
 * It validates the request parameters and body using Zod schema, delegates the update
 * logic to LaboratoryService, handles cases where the laboratory is not found,
 * and returns appropriate responses.
 *
 * @param c - The Hono context containing request and response objects
 * @param c.req.valid - Validates the request parameters and body using Zod schema
 * @param c.req.valid('param') - Extracts the laboratory ID from URL parameters
 * @param c.req.valid('json') - Extracts and validates the updated laboratory data from request body
 * @param c.json - Sends JSON response with updated laboratory data or error message
 * @returns A Promise resolving to a Hono response object containing updated laboratory or error
 *
 * @example
 * // Example usage in route:
 * // PATCH /laboratories/:id { name: "Physics Lab", location: "Building B" }
 * // Response: { message: 'Laboratory updated successfully', data: {...} }
 *
 * @throws {404} When laboratory is not found
 * @throws {500} When an internal server error occurs
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
 * Handler for deleting a laboratory by ID.
 *
 * This handler processes DELETE requests to remove a laboratory by its ID.
 * It validates the request parameters using Zod schema, delegates the deletion
 * logic to LaboratoryService, handles cases where the laboratory is not found,
 * and returns appropriate responses.
 *
 * @param c - The Hono context containing request and response objects
 * @param c.req.valid - Validates the request parameters using Zod schema
 * @param c.req.valid('param') - Extracts the laboratory ID from URL parameters
 * @param c.json - Sends JSON response with success or error message
 * @returns A Promise resolving to a Hono response object containing success or error
 *
 * @example
 * // Example usage in route:
 * // DELETE /laboratories/:id
 * // Response: { message: 'Laboratory deleted successfully' }
 *
 * @throws {404} When laboratory is not found
 * @throws {500} When an internal server error occurs
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
 * Handler for listing laboratories with pagination.
 *
 * This handler processes GET requests to retrieve a paginated list of laboratories.
 * It validates the request query parameters using Zod schema, delegates the listing
 * logic to LaboratoryService, and returns appropriate responses with pagination metadata.
 *
 * @param c - The Hono context containing request and response objects
 * @param c.req.valid - Validates the request query parameters using Zod schema
 * @param c.req.valid('query') - Extracts pagination parameters (page, limit) from query string
 * @param c.json - Sends JSON response with paginated laboratory data or error message
 * @returns A Promise resolving to a Hono response object containing paginated laboratories or error
 *
 * @example
 * // Example usage in route:
 * // GET /laboratories?page=1&limit=10
 * // Response: { message: 'Laboratories retrieved successfully', data: [...], pagination: {...} }
 *
 * @throws {500} When an internal server error occurs
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
 * Handler for retrieving all laboratories without pagination.
 *
 * This handler processes GET requests to retrieve all laboratories at once.
 * It delegates the retrieval logic to LaboratoryService and returns appropriate responses.
 *
 * @param c - The Hono context containing request and response objects
 * @param c.json - Sends JSON response with all laboratory data or error message
 * @returns A Promise resolving to a Hono response object containing all laboratories or error
 *
 * @example
 * // Example usage in route:
 * // GET /laboratories/all
 * // Response: { message: 'All laboratories retrieved successfully', data: [...] }
 *
 * @throws {500} When an internal server error occurs
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
