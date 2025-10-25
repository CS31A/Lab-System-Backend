/**
 * @fileoverview Soft delete user handler - marks user as deleted without removing from database
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { SoftDeleteUserRoute } from '@/routes/users/users.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

/**
 * Soft deletes a user by marking them as deleted in the database while preserving their data.
 * This operation can be reversed using the restore endpoint.
 *
 * @param c - The Hono context object containing the validated request parameters
 * @returns A JSON response indicating success or failure of the soft delete operation
 */
export const SoftDeleteUserHandler: AppRouteHandler<SoftDeleteUserRoute> = async (c) => {
  const { id: userId } = c.req.valid('param')

  try {
    const userService = new UserService(c)
    const user = await userService.softDeleteUser(userId)
    const { password, ...userWithoutPassword } = user

    return c.json(
      {
        message: 'User soft-deleted successfully',
        data: userWithoutPassword,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    if (errorMessage === 'User not found') {
      return c.json(
        { message: 'User not found' },
        httpStatusCodes.NOT_FOUND,
      )
    }

    c.var.logger.error('User soft delete failed', {
      error: errorMessage,
      user_id: userId,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred while soft deleting the user',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
