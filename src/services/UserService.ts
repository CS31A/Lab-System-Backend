/**
 * @fileoverview UserService - Core business logic for user management
 * Handles user creation, role management, and transaction coordination
 */

import type { Context } from 'hono'
import bcrypt from 'bcryptjs'
import { count, eq } from 'drizzle-orm'
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

export interface UpdateUserData {
  username?: string
  email?: string
  password?: string
  user_type?: string
  firstname?: string | null
  lastname?: string | null
  confirmPassword?: string
}

export interface UpdateUserResult {
  user: typeof users.$inferSelect
  roleRecord: RoleRecord | null
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

  /**
   * Updates an existing user and their role-specific profile
   * Handles password hashing, role changes, and data validation
   */
  async updateUser(userId: string, updateData: UpdateUserData): Promise<UpdateUserResult> {
    // First, check if user exists
    const existingUser = await this.getUserById(userId)
    if (!existingUser) {
      throw new Error('User not found')
    }

    // Prepare user update data
    const userUpdateData: Partial<typeof users.$inferInsert> = {}

    // Handle password update if provided
    if (updateData.password) {
      if (updateData.confirmPassword && updateData.password !== updateData.confirmPassword)
        throw new Error('Passwords don\'t match')
      userUpdateData.password = await bcrypt.hash(updateData.password, 10)
    }

    // Add other user fields if provided
    if (updateData.username)
      userUpdateData.username = updateData.username
    if (updateData.email)
      userUpdateData.email = updateData.email
    if (updateData.user_type)
      userUpdateData.user_type = updateData.user_type.toLowerCase()

    let updatedUser: typeof users.$inferSelect
    let roleRecord: RoleRecord | null = null

    try {
      // Update user record
      if (Object.keys(userUpdateData).length > 0) {
        [updatedUser] = await this.db
          .update(users)
          .set(userUpdateData)
          .where(eq(users.id, userId))
          .returning()
      }
      else {
        updatedUser = existingUser
      }

      // Handle role profile updates if firstname/lastname provided or user_type changed
      const shouldUpdateRole = updateData.firstname !== undefined
        || updateData.lastname !== undefined
        || (updateData.user_type && updateData.user_type !== existingUser.user_type)

      if (shouldUpdateRole) {
        const targetUserType = updateData.user_type || existingUser.user_type
        roleRecord = await this.updateUserProfile(userId, targetUserType, {
          firstname: updateData.firstname,
          lastname: updateData.lastname,
        })
      }

      this.logger.info('User updated successfully', {
        user_id: userId,
        updated_fields: Object.keys(userUpdateData),
        role_updated: !!roleRecord,
        timestamp: new Date().toISOString(),
      })

      return { user: updatedUser, roleRecord }
    }
    catch (error) {
      this.logger.error('User update failed', {
        user_id: userId,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Updates role-specific user profile based on user_type
   * Creates new role record if user_type changed, updates existing if found
   */
  async updateUserProfile(
    userId: string,
    userType: string,
    profileData: { firstname?: string | null, lastname?: string | null },
  ): Promise<RoleRecord | null> {
    const { firstname, lastname } = profileData

    // Prepare update data (only include defined values)
    const updateData: any = {}
    if (firstname !== undefined)
      updateData.firstname = firstname
    if (lastname !== undefined)
      updateData.lastname = lastname

    // If no profile data to update, return null
    if (Object.keys(updateData).length === 0) {
      return null
    }

    switch (userType) {
      case 'teacher': {
        // Try to update existing teacher record
        const [existingTeacher] = await this.db
          .select()
          .from(teachers)
          .where(eq(teachers.user_id, userId))
          .limit(1)

        if (existingTeacher) {
          const [updatedTeacher] = await this.db
            .update(teachers)
            .set(updateData)
            .where(eq(teachers.user_id, userId))
            .returning()
          return updatedTeacher
        }
        else {
          // Create new teacher record if doesn't exist
          const [newTeacher] = await this.db
            .insert(teachers)
            .values({
              user_id: userId,
              ...updateData,
              attendance: 'present',
            })
            .returning()
          return newTeacher
        }
      }

      case 'technical_staff': {
        const [existingStaff] = await this.db
          .select()
          .from(technical_staff)
          .where(eq(technical_staff.user_id, userId))
          .limit(1)

        if (existingStaff) {
          const [updatedStaff] = await this.db
            .update(technical_staff)
            .set(updateData)
            .where(eq(technical_staff.user_id, userId))
            .returning()
          return updatedStaff
        }
        else {
          const [newStaff] = await this.db
            .insert(technical_staff)
            .values({
              user_id: userId,
              ...updateData,
            })
            .returning()
          return newStaff
        }
      }

      case 'admin': {
        const [existingAdmin] = await this.db
          .select()
          .from(admins)
          .where(eq(admins.user_id, userId))
          .limit(1)

        if (existingAdmin) {
          const [updatedAdmin] = await this.db
            .update(admins)
            .set(updateData)
            .where(eq(admins.user_id, userId))
            .returning()
          return updatedAdmin
        }
        else {
          const [newAdmin] = await this.db
            .insert(admins)
            .values({
              user_id: userId,
              ...updateData,
            })
            .returning()
          return newAdmin
        }
      }

      default:
        this.logger.warn('Unknown user_type for profile update', {
          user_type: userType,
          user_id: userId,
          timestamp: new Date().toISOString(),
        })
        return null
    }
  }

  /**
   * Retrieves a user by ID
   * Used for validation before updates
   */
  async softDeleteUser(userId: string): Promise<typeof users.$inferSelect> {
    const existingUser = await this.getUserById(userId)
    if (!existingUser)
      throw new Error('User not found')

    const [updated] = await this.db
      .update(users)
      .set({ is_deleted: true, deleted_at: new Date() })
      .where(eq(users.id, userId))
      .returning()

    return updated
  }

  async restoreUser(userId: string): Promise<typeof users.$inferSelect> {
    const existingUser = await this.getUserById(userId)
    if (!existingUser)
      throw new Error('User not found')

    const [updated] = await this.db
      .update(users)
      .set({ is_deleted: false, deleted_at: null as any })
      .where(eq(users.id, userId))
      .returning()

    return updated
  }

  async getUserById(userId: string): Promise<typeof users.$inferSelect | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    return user || null
  }

  /**
   * Lists users with pagination
   */
  async listUsers(params: { page: number, limit: number }): Promise<{ users: Array<typeof users.$inferSelect>, pagination: { page: number, limit: number, total: number, totalPages: number, hasNext: boolean, hasPrev: boolean } }> {
    const { page, limit } = params
    const offset = (page - 1) * limit

    const [{ count: total }, usersData] = await Promise.all([
      this.db.select({ count: count() })
        .from(users)
        .then(r => r[0] || { count: 0 }),
      this.db.select()
        .from(users)
        .limit(limit)
        .offset(offset)
        .orderBy(users.created_at),
    ])

    const totalPages = Math.ceil((total || 0) / limit) || 1

    return {
      users: usersData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  /**
   * Retrieves all users
   */
  async getAllUsers(): Promise<Array<typeof users.$inferSelect>> {
    const allUsers = await this.db.select().from(users)
    return allUsers
  }
}
