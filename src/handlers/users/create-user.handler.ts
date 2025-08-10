/**
 * @fileoverview User creation handler - delegates to UserService for business logic
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { CreateUserRoute } from '@/routes/users/users.route'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { UserService } from '@/services/UserService'

/**
 * Creates new user accounts with role-based access control.
 * Delegates business logic to UserService for better separation of concerns.
 */
export const CreateUserHandler: AppRouteHandler<CreateUserRoute> = async (c) => {
  // The validated request body is destructured since the confirmPassword is now useless after validation in the middleware
  const { firstname, lastname, ...validatedBody } = c.req.valid('json')

  try {
    const userService = new UserService(c)

    const userData = {
      ...validatedBody,
      firstname,
      lastname,
    }

    const { user: createdUser, roleRecord } = await userService.createUser(userData)

    // Success! Remove password from response
    const { password, ...userWithoutPassword } = createdUser

    return c.json(
      {
        message: `User created successfully${roleRecord ? ` with ${validatedBody.user_type} profile` : ''}`,
        data: userWithoutPassword,
      },
      httpStatusCodes.CREATED,
    )
  }
  catch (err) {
    // Log with context for debugging, avoid exposing sensitive details
    c.var.logger.error('User creation failed', {
      error: (err as Error).message,
      email: validatedBody.email,
      user_type: validatedBody.user_type,
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
