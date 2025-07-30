/**
 * @fileoverview UserService - Core business logic for user management
 * Handles user creation, role management, and transaction coordination
 */

import type { Context } from 'hono'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { admins, teachers, technical_staff, users } from '@/db/schema'

export interface CreateUserData {
  username: string
  email: string
  password: string
  user_type: string
  firstname?: string | null
  lastname?: string | null
}

export interface CreateUserResult {
  user: typeof users.$inferSelect
  roleRecord: RoleRecord | null // or pwede pud any | null nya remove the type def below
}

export type RoleRecord = | typeof teachers.$inferInsert | typeof technical_staff.$inferInsert | typeof admins.$inferInsert

export class UserService {
  private db: ReturnType<typeof createDb>
  private logger: any

  constructor(c: Context) {
    this.db = createDb(c)
    this.logger = c.var.logger
  }

  /**
   * Creates a new user with hashed password and role-specific profile
   * Manages transaction rollback on failure
   */
  async createUser(userData: CreateUserData): Promise<CreateUserResult> {
    // Hash password with bcrypt using 10 rounds for security/performance balance
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Declare variables outside try block for proper scope
    let createdUser: typeof users.$inferSelect
    let roleRecord = null

    try {
      // Create the user first
      [createdUser] = await this.db
        .insert(users)
        .values({
          password: hashedPassword,
          username: userData.username,
          user_type: userData.user_type,
          email: userData.email,
        })
        .returning()

      // Create corresponding role-specific record
      roleRecord = await this.createUserProfile(createdUser.id, userData)

      // Check if role should have been created but wasn't
      const shouldHaveRole = ['teacher', 'technical_staff', 'admin'].includes(userData.user_type)
      if (shouldHaveRole && !roleRecord) {
        this.logger.error('Role record was not created for required user type', {
          user_id: createdUser.id,
          user_type: userData.user_type,
          timestamp: new Date().toISOString(),
        })

        // Cleanup user since role creation silently failed
        await this.cleanupUser(createdUser.id)
        throw new Error('Role creation silently failed')
      }

      // Log successful creation with role information
      this.logger.info('User and role record created successfully', {
        user_id: createdUser.id,
        user_type: userData.user_type,
        role_record_created: !!roleRecord,
        should_have_role: shouldHaveRole,
        timestamp: new Date().toISOString(),
      })

      return { user: createdUser, roleRecord }
    }
    catch (roleError) {
      // Role creation failed - cleanup user if it was created
      if (createdUser!) {
        this.logger.error('Role creation failed, cleaning up user', {
          user_id: createdUser.id,
          user_type: userData.user_type,
          error: (roleError as Error).message,
          timestamp: new Date().toISOString(),
        })

        await this.cleanupUser(createdUser.id)
      }

      throw roleError
    }
  }

  /**
   * Creates role-specific user profile based on user_type
   * Returns the created role record or null if no role needed
   */
  async createUserProfile(userId: string, userData: CreateUserData): Promise<RoleRecord | null> {
    const { user_type, firstname, lastname } = userData

    switch (user_type) {
      case 'teacher':
      { const [teacherRecord] = await this.db
        .insert(teachers)
        .values({
          user_id: userId,
          firstname: firstname || null,
          lastname: lastname || null,
          attendance: 'present', // Default value
        })
        .returning()
      return teacherRecord }

      case 'technical_staff':
      { const [staffRecord] = await this.db
        .insert(technical_staff)
        .values({
          user_id: userId,
          firstname: firstname || null,
          lastname: lastname || null,
        })
        .returning()
      return staffRecord }

      case 'admin':
      { const [adminRecord] = await this.db
        .insert(admins)
        .values({
          user_id: userId,
          firstname: firstname || null,
          lastname: lastname || null,
        })
        .returning()
      return adminRecord }

      default:
        // If user_type doesn't match any role, just return null
        this.logger.warn('Unknown user_type, only user record created', {
          user_type,
          user_id: userId,
          timestamp: new Date().toISOString(),
        })
        return null
    }
  }

  /**
   * Cleanup user record when role creation fails
   * Handles cleanup errors gracefully with logging
   */
  private async cleanupUser(userId: string): Promise<void> {
    try {
      await this.db.delete(users).where(eq(users.id, userId))
      this.logger.info('User cleanup completed after role creation failure', {
        user_id: userId,
        timestamp: new Date().toISOString(),
      })
    }
    catch (cleanupError) {
      this.logger.error('Failed to cleanup user after role creation failure', {
        user_id: userId,
        cleanup_error: (cleanupError as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw cleanupError
    }
  }
}
