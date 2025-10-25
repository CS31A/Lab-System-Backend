/**
 * @fileoverview Restore user handler - restores a soft-deleted user
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { RestoreUserRoute } from '@/routes/users/users.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

/**
 * Restores a soft-deleted user by removing the deleted status from the database.
 *
 * @param c - The Hono context object containing the validated request parameters
 * @returns A JSON response containing the restored user data or an error message
 */
export const RestoreUserHandler: AppRouteHandler<RestoreUserRoute> = async (c) => {
  const { id: userId } = c.req.valid('param')

  try {
    const userService = new UserService(c)
    const user = await userService.restoreUser(userId)
    const { password, ...userWithoutPassword } = user

    return c.json(
      {
        message: 'User restored successfully',
        data: userWithoutPassword,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const errorMessage = (err as Error).message

    if (errorMessage === 'User not found') {
      return c.json(
        { message: 'User not found' },
        httpStatusCodes.NOT_FOUND,
      )
    }

    c.var.logger.error('User restore failed', {
      error: errorMessage,
      user_id: userId,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred while restoring the user',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
