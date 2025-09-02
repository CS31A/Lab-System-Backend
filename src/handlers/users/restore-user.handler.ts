import type { AppRouteHandler } from '@/lib/types/app-types'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

export const RestoreUserHandler: AppRouteHandler<typeof import('@/routes/users/users.route').restoreUserRoute> = async (c) => {
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
