import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetAllUsersRoute } from '@/routes/users/users.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

/**
 * Retrieves all users from the database without pagination.
 * Delegates business logic to UserService for better separation of concerns.
 *
 * @param c - The Hono context object containing the request and response
 * @returns A JSON response containing the list of users or an error message
 */
export const GetAllUsersHandler: AppRouteHandler<GetAllUsersRoute> = async (c) => {
  try {
    const userService = new UserService(c)
    const users = await userService.getAllUsers()

    return c.json(
      {
        message: 'All users successfully retrieved',
        data: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          user_type: user.user_type,
          is_deleted: user.is_deleted ?? null,
          deleted_at: user.deleted_at ?? null,
          created_at: user.created_at,
          updated_at: user.updated_at,
        })),
      },
      httpStatusCodes.OK,
    )
  }
  catch (err) {
    // Log error with context for debugging
    c.var.logger.error('Failed to retrieve all users', {
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        message: 'Internal Server Error',
        errors: 'An unexpected error occurred while retrieving all users',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
