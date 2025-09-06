/**
 * @fileoverview Hard delete user handler - permanently removes user from database
 * WARNING: This operation is irreversible and should only be used by administrators
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { HardDeleteUserRoute } from '@/routes/users/users.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

/**
 * Permanently deletes a user and all associated data from the database.
 * This operation is irreversible and should be used with extreme caution.
 *
 * The handler performs the following operations:
 * 1. Validates the user ID parameter
 * 2. Delegates to UserService for the hard delete operation
 * 3. Handles errors appropriately (user not found, database errors)
 * 4. Returns success response when deletion is complete
 * 5. Logs the operation for auditing purposes
 *
 * @param c - Hono context containing validated request parameters
 * @returns JSON response indicating success or failure of the operation
 *
 * @example
 * DELETE /users/123
 * Response: { "message": "User permanently deleted successfully" }
 */
export const HardDeleteUserHandler: AppRouteHandler<
  HardDeleteUserRoute
> = async (c) => {
  // Extract validated user ID from request parameters
  const { id: userId } = c.req.valid('param')

  try {
    const userService = new UserService(c)

    // Perform the hard delete operation
    const deletedUser = await userService.hardDeleteUser(userId)

    // Log successful deletion for auditing
    c.var.logger.info('User hard delete operation completed', {
      user_id: userId,
      username: deletedUser.username,
      user_type: deletedUser.user_type,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'User permanently deleted successfully',
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const error = err as Error

    // Handle specific error cases
    if (error.message === 'User not found') {
      c.var.logger.warn('Hard delete attempted on non-existent user', {
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

    // Log unexpected errors with context for debugging
    c.var.logger.error('Hard delete operation failed', {
      user_id: userId,
      error: error.message,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred during user deletion',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
