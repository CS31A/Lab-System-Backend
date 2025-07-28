/**
 * @fileoverview User creation handler with secure password hashing and role-based access
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { CreateUserRoute } from '@/routes/users/users.route'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { admins, teachers, technical_staff, users } from '@/db/schema'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Creates new user accounts with role-based access control.
 * Handles password security, uniqueness validation, and audit logging.
 * Automatically creates corresponding role-specific records (teacher, technical_staff, admin).
 */
export const CreateUserHandler: AppRouteHandler<CreateUserRoute> = async (c) => {
  // The validated request body is destructured since the confirmPassword is now useless after validation in the middleware
  const { confirmPassword, firstname, lastname, ...validatedBody } = c.req.valid('json')

  try {
    // Use bcrypt with 10 rounds for security/performance balance
    const hashedPassword = await bcrypt.hash(validatedBody.password, 10)

    const db = createDb(c)

    // Declare variables outside try block for proper scope
    let createdUser
    let roleRecord = null

    try {
      // Create the user first
      [createdUser] = await db
        .insert(users)
        .values({
          password: hashedPassword,
          username: validatedBody.username,
          user_type: validatedBody.user_type,
          email: validatedBody.email,
        })
        .returning()

      // Create corresponding role-specific record based on user_type
      switch (validatedBody.user_type) {
        case 'teacher':
          [roleRecord] = await db
            .insert(teachers)
            .values({
              user_id: createdUser.id,
              firstname: firstname || null, // Use provided value or null
              lastname: lastname || null, // Use provided value or null
              attendance: 'present', // Default value
            })
            .returning()
          break

        case 'technical_staff':
          [roleRecord] = await db
            .insert(technical_staff)
            .values({
              user_id: createdUser.id,
              firstname: firstname || null, // Use provided value or null
              lastname: lastname || null, // Use provided value or null
            })
            .returning()
          break

        case 'admin':
          [roleRecord] = await db
            .insert(admins)
            .values({
              user_id: createdUser.id,
              firstname: firstname || null, // Use provided value or null
              lastname: lastname || null, // Use provided value or null
            })
            .returning()
          break

        default:
          // If user_type doesn't match any role, just create the user
          c.var.logger.warn('Unknown user_type, only user record created', {
            user_type: validatedBody.user_type,
            user_id: createdUser.id,
            timestamp: new Date().toISOString(),
          })
      }
    }
    catch (roleError) {
      // Role creation failed - cleanup user if it was created
      if (createdUser) {
        c.var.logger.error('Role creation failed, cleaning up user', {
          user_id: createdUser.id,
          user_type: validatedBody.user_type,
          error: (roleError as Error).message,
          timestamp: new Date().toISOString(),
        })

        try {
          await db.delete(users).where(eq(users.id, createdUser.id))
          c.var.logger.info('User cleanup completed after role creation failure', {
            user_id: createdUser.id,
            timestamp: new Date().toISOString(),
          })
        }
        catch (cleanupError) {
          c.var.logger.error('Failed to cleanup user after role creation failure', {
            user_id: createdUser.id,
            cleanup_error: (cleanupError as Error).message,
            original_error: (roleError as Error).message,
            timestamp: new Date().toISOString(),
          })
        }
      }

      // Return error response
      return c.json(
        {
          message: 'User creation failed during role setup',
          errors: (roleError as Error).message,
        },
        httpStatusCodes.INTERNAL_SERVER_ERROR,
      )
    }

    // Check if role should have been created but wasn't
    const shouldHaveRole = ['teacher', 'technical_staff', 'admin'].includes(validatedBody.user_type)
    if (shouldHaveRole && !roleRecord) {
      c.var.logger.error('Role record was not created for required user type', {
        user_id: createdUser.id,
        user_type: validatedBody.user_type,
        timestamp: new Date().toISOString(),
      })

      // Cleanup user since role creation silently failed
      try {
        await db.delete(users).where(eq(users.id, createdUser.id))
        c.var.logger.info('User cleanup completed after silent role creation failure', {
          user_id: createdUser.id,
          timestamp: new Date().toISOString(),
        })
      }
      catch (cleanupError) {
        c.var.logger.error('Failed to cleanup user after silent role creation failure', {
          user_id: createdUser.id,
          cleanup_error: (cleanupError as Error).message,
          timestamp: new Date().toISOString(),
        })
      }

      return c.json(
        {
          message: 'User creation failed - role record could not be created',
          errors: 'Role creation silently failed',
        },
        httpStatusCodes.INTERNAL_SERVER_ERROR,
      )
    }

    // Success! Remove password from response
    const { password, ...userWithoutPassword } = createdUser

    // Log successful creation with role information
    c.var.logger.info('User and role record created successfully', {
      user_id: createdUser.id,
      user_type: validatedBody.user_type,
      role_record_created: !!roleRecord,
      should_have_role: shouldHaveRole,
      timestamp: new Date().toISOString(),
    })

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
