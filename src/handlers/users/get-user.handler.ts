import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetUserRoute } from '@/routes/users/users.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

/**
 * Handler for retrieving a user by ID.
 *
 * This handler processes GET requests to retrieve a specific user by their ID.
 * It uses the UserService to fetch user data from the database, handles
 * cases where the user is not found, and returns appropriate responses.
 * The user's password is excluded from the response for security.
 *
 * @param c - The Hono context containing request and response objects
 * @param c.req.valid - Validates the request parameters using Zod schema
 * @param c.req.valid('param') - Extracts the user ID from URL parameters
 * @param c.json - Sends JSON response with user data or error message
 * @returns A Promise resolving to a Hono response object containing user data or error
 *
 * @example
 * // Example usage in route:
 * // GET /users/:id
 * // Response: { message: 'User of Id 123 is successfully retrieved', data: {...} }
 *
 * @throws {404} When user is not found
 * @throws {500} When an internal server error occurs
 */
export const GetUserHandler: AppRouteHandler<GetUserRoute> = async (c) => {
  const { id: userId } = c.req.valid('param')

  try {
    const userService = new UserService(c)

    const userData = await userService.getUserById(userId)

    if (!userData) {
      return c.json(
        {
          message: 'User not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }

    // Destructure to omit password and include role-specific data
    const { password: _password, ...userAndRoleWithoutPassword } = userData

    return c.json({
      message: `User of Id ${userId} is successfully retrieved`,
      data: userAndRoleWithoutPassword,
    }, httpStatusCodes.OK)
  }
  catch (err) {
    const errorMessage = (err as Error).message

    // Handle specific error cases
    if (errorMessage === 'User not found') {
      c.var.logger.warn('User retrieval failed - user not found', {
        user_id: userId,
        timestamp: new Date().toISOString(),
      })

      return c.json(
        {
          message: 'User not found',
        },
        httpStatusCodes.NOT_FOUND,
      )
    }
    // Log error with context for debugging
    c.var.logger.error('User retrieval failed', {
      error: errorMessage,
      user_id: userId,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred while retrieving the user',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
