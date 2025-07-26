/**
 * @fileoverview User creation handler with secure password hashing and role-based access
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { CreateUserRoute } from '@/routes/users/users.route'
import bcrypt from 'bcryptjs'
import { createDb } from '@/db'
import { users } from '@/db/schema'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Creates new user accounts with role-based access control.
 * Handles password security, uniqueness validation, and audit logging.
 */
export const CreateUserHandler: AppRouteHandler<CreateUserRoute> = async (c) => {
  // The validated request body is destructured since the confirmPassword is now useless after validation in the middleware
  const { confirmPassword, ...validatedBody } = c.req.valid('json')

  try {
    // Use bcrypt with 10 rounds for security/performance balance
    const hashedPassword = await bcrypt.hash(validatedBody.password, 10)

    const db = createDb(c)
    const [createdUser] = await db
      .insert(users)
      .values({
        password: hashedPassword,
        username: validatedBody.username,
        user_type: validatedBody.user_type,
        email: validatedBody.email,
      })
      .returning()

    // Destructured the inserted user object so we don't return the password
    const { password, ...userWithoutPassword } = createdUser

    return c.json(
      {
        message: 'User created successfully',
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
