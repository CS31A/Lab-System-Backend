/**
 * @fileoverview User update handler - delegates to UserService for business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { UpdateUserRoute } from '@/routes/users/users.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

/**
 * Updates existing user accounts with role-based profile management.
 * Handles password updates, role changes, and profile information updates.
 * Delegates business logic to UserService for better separation of concerns.
 */
export const UpdateUserHandler: AppRouteHandler<UpdateUserRoute> = async (c) => {
  // Extract validated path parameter and request body
  const { id: userId } = c.req.valid('param')
  const { ...updateData } = c.req.valid('json')

  try {
    const userService = new UserService(c)

    // Call the update service with the user ID and update data
    const { user: updatedUser, roleRecord } = await userService.updateUser(userId, updateData)

    // Remove password from response for security
    const { password, ...userWithoutPassword } = updatedUser

    return c.json(
      {
        message: `User updated successfully${roleRecord ? ' with profile changes' : ''}`,
        data: userWithoutPassword,
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    const errorMessage = (err as Error).message

    // Handle specific error cases
    if (errorMessage === 'User not found') {
      c.var.logger.warn('User update failed - user not found', {
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

    if (errorMessage === 'Passwords don\'t match') {
      return c.json(
        {
          message: 'Bad Request',
          errors: 'Password confirmation does not match',
        },
        httpStatusCodes.BAD_REQUEST,
      )
    }

    // Log error with context for debugging
    c.var.logger.error('User update failed', {
      error: errorMessage,
      user_id: userId,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred during user update',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
