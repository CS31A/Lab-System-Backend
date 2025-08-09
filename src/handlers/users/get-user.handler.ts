import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetUserRoute } from '@/routes/users/users.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

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
        errors: errorMessage,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
