/**
 * @fileoverview Get Me handler - returns minimal info from the verified JWT payload
 * Response follows { message, data } format.
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetCurrentUserRoute } from '@/routes/auth/auth.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Handles the request to get the current user's information from the JWT payload.
 * This handler is protected by authentication middleware, which verifies the JWT
 * and attaches its payload to the context.
 *
 * @param c - The Hono context, containing the verified JWT payload.
 * @returns A JSON response with the user's ID (sub) and role, or an error response.
 */
export const GetCurrentUserHandler: AppRouteHandler<GetCurrentUserRoute> = async (c) => {
  try {
    // Retrieve the JWT payload attached by the authentication middleware
    const payload = c.get('jwtPayload')
    const { sub, role } = payload

    // Return the essential user information from the token
    return c.json(
      {
        message: 'Successfully retrieved user information from token',
        data: { sub, role },
      },
      httpStatusCodes.OK,
    )
  }
  catch (error) {
    const errMsg = (error as Error).message
    // Log the error for debugging purposes
    c.var.logger.error('Failed to retrieve current user information', {
      error: errMsg,
      timestamp: new Date().toISOString(),
    })

    // Return a generic error response to the client
    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred while retrieving user information',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
