import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetAllUsersRoute } from '@/routes/users/users.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

/**
 * Gets all users without pagination
 * Filename and export follow conventions:
 * - File: get-all-users.handler.ts
 * - Export: GetAllUsersHandler
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
        errors: (err as Error).message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
