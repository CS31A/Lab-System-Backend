import type { AppRouteHandler } from '@/lib/types/app-types'

import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

export const SoftDeleteUserHandler: AppRouteHandler<typeof import('@/routes/users/users.route').softDeleteUserRoute> = async (c) => {
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
    const errorMessage = (err as Error).message

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
        errors: errorMessage,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
