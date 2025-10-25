import type { AppRouteHandler } from '@/lib/types/app-types'
import type { ListUsersRoute } from '@/routes/users/users.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

/**
 * Lists users with pagination.
 * Delegates business logic to UserService for better separation of concerns.
 *
 * @param c - The Hono context object containing the request and response
 * @returns A JSON response containing the paginated list of users or an error message
 */
export const ListUsersHandler: AppRouteHandler<ListUsersRoute> = async (c) => {
  const userService = new UserService(c)
  const { page, limit } = c.req.valid('query')
  const { users, pagination } = await userService.listUsers({ page, limit })

  return c.json(
    {
      message: 'Users successfully retrieved',
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
      pagination,
    },
    httpStatusCodes.OK,
  )
}
