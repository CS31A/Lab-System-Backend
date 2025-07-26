import type { AppRouteHandler } from '@/lib/types/app-types'
import type { CreateUserRoute } from '@/routes/users/users.route'
import bcrypt from 'bcryptjs'
import { createDb } from '@/db'
import { users } from '@/db/schema'
import * as httpStatusCodes from '@/openapi/http-status-codes'

export const CreateUserHandler: AppRouteHandler<CreateUserRoute> = async (c) => {
  const { confirmPassword, ...validatedBody } = c.req.valid('json')

  try {
    const hashedPassword = await bcrypt.hash(validatedBody.password, 10)

    const db = createDb(c)
    const [createdUser] = await db
      .insert(users)
      .values({
        password: hashedPassword,
        username: validatedBody.username,
        user_type: validatedBody.user_type,
        email: validatedBody.email
      })
      .returning()

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
    c.var.logger.error('User creation error', JSON.stringify(err))
    return c.json(
      {
        message: 'Internal Server Error',
        errors: (err as Error).message,
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
