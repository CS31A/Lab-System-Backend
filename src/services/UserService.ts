/**
 * @fileoverview UserService - Core business logic for user management
 * Handles user creation, role management, and transaction coordination
 */

import type { Context } from 'hono'
import bcrypt from 'bcryptjs'
import { and, count, eq } from 'drizzle-orm'
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
  roleRecord: RoleRecord | null
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

export type RoleRecord = typeof teachers.$inferSelect | typeof technical_staff.$inferSelect | typeof admins.$inferSelect

// Define a type for the combined user and role data
export type UserWithRole = typeof users.$inferSelect & {
  teacher?: typeof teachers.$inferSelect | null
  technical_staff?: typeof technical_staff.$inferSelect | null
  admin?: typeof admins.$inferSelect | null
}

/**
 * UserService - Handles all user-related business logic including creation, updates, and role management
 *
 * This service manages user accounts and their associated role-specific profiles (teacher, admin, technical_staff).
 * It handles password hashing, role assignment, and maintains data consistency across user and role tables.
 *
 * @example
 * ```typescript
 * const userService = new UserService(context)
 * const result = await userService.createUser({
 *   username: 'john_doe',
 *   email: 'john@example.com',
 *   password: 'securePassword123',
 *   user_type: 'teacher',
 *   firstname: 'John',
 *   lastname: 'Doe'
 * })
 * ```
 */
export class UserService {
  private db: ReturnType<typeof createDb>
  private logger: any

  /**
   * Creates a new UserService instance
   * @param c - Hono context containing database connection and logger
   */
  constructor(c: Context) {
    this.db = createDb(c)
    this.logger = c.var.logger
  }

  /**
   * Creates a new user account with hashed password and role-specific profile
   *
   * This method performs the following operations:
   * 1. Hashes the user's password using bcrypt (10 rounds)
   * 2. Creates the base user record
   * 3. Creates the appropriate role-specific profile (teacher/admin/technical_staff)
   * 4. Handles cleanup if role creation fails
   *
   * @param userData - User data including credentials and role information
   * @param userData.username - Unique username for the user
   * @param userData.email - Unique email address
   * @param userData.password - Plain text password (will be hashed)
   * @param userData.user_type - Role type: 'teacher', 'admin', or 'technical_staff'
   * @param userData.firstname - Optional first name
   * @param userData.lastname - Optional last name
   *
   * @returns Promise resolving to created user and role record
   * @returns result.user - The created user record (without password)
   * @returns result.roleRecord - The created role-specific record or null
   *
   * @throws {Error} When user creation fails due to validation or database constraints
   * @throws {Error} When role creation fails (triggers user cleanup)
   *
   * @example
   * ```typescript
   * try {
   *   const result = await userService.createUser({
   *     username: 'jane_teacher',
   *     email: 'jane@school.edu',
   *     password: 'SecurePass123!',
   *     user_type: 'teacher',
   *     firstname: 'Jane',
   *     lastname: 'Smith'
   *   })
   *   console.log('User created:', result.user.id)
   *   console.log('Role created:', result.roleRecord?.id)
   * } catch (error) {
   *   console.error('User creation failed:', error.message)
   * }
   * ```
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
   * Creates a role-specific profile for a user based on their user_type
   *
   * This method creates the appropriate role record in the corresponding table:
   * - 'teacher' → creates record in teachers table
   * - 'technical_staff' → creates record in technical_staff table
   * - 'admin' → creates record in admins table
   * - Other types → returns null (no role record created)
   *
   * @param userId - The ID of the user to create a profile for
   * @param userData - User data containing role type and profile information
   * @param userData.user_type - The type of role to create
   * @param userData.firstname - Optional first name for the profile
   * @param userData.lastname - Optional last name for the profile
   *
   * @returns Promise resolving to the created role record or null if no role needed
   *
   * @throws {Error} When database insertion fails
   *
   * @example
   * ```typescript
   * const roleRecord = await userService.createUserProfile('user123', {
   *   user_type: 'teacher',
   *   firstname: 'John',
   *   lastname: 'Doe'
   * })
   * if (roleRecord) {
   *   console.log('Teacher profile created:', roleRecord.id)
   * }
   * ```
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
   * Cleans up a user record when role creation fails
   *
   * This private method is called when user creation succeeds but role creation fails.
   * It removes the orphaned user record to maintain data consistency.
   * Cleanup errors are logged but don't prevent the original error from being thrown.
   *
   * @param userId - The ID of the user record to clean up
   *
   * @returns Promise that resolves when cleanup is complete
   *
   * @throws {Error} When cleanup fails (logged and re-thrown)
   *
   * @private
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
   *
   * This method updates both the base user record and the associated role profile.
   * It handles password hashing if a new password is provided and validates
   * password confirmation if both password and confirmPassword are present.
   *
   * @param userId - The ID of the user to update
   * @param updateData - Partial user data to update
   * @param updateData.username - New username (must be unique)
   * @param updateData.email - New email address (must be unique)
   * @param updateData.password - New password (will be hashed)
   * @param updateData.confirmPassword - Password confirmation (must match password)
   * @param updateData.user_type - New role type (triggers role profile update)
   * @param updateData.firstname - New first name
   * @param updateData.lastname - New last name
   *
   * @returns Promise resolving to updated user and role record
   * @returns result.user - The updated user record (without password)
   * @returns result.roleRecord - The updated role-specific record or null
   *
   * @throws {Error} When user is not found
   * @throws {Error} When passwords don't match
   * @throws {Error} When database update fails
   *
   * @example
   * ```typescript
   * const result = await userService.updateUser('user123', {
   *   firstname: 'Jane',
   *   lastname: 'Smith',
   *   password: 'NewSecurePass123!',
   *   confirmPassword: 'NewSecurePass123!'
   * })
   * console.log('User updated:', result.user.username)
   * ```
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
   * Soft deletes a user by setting is_deleted flag and deleted_at timestamp
   *
   * This method marks a user as deleted without actually removing the record from the database.
   * This allows for data recovery and maintains referential integrity with related records.
   *
   * @param userId - The ID of the user to soft delete
   *
   * @returns Promise resolving to the updated user record
   *
   * @throws {Error} When user is not found
   * @throws {Error} When database update fails
   *
   * @example
   * ```typescript
   * const deletedUser = await userService.softDeleteUser('user123')
   * console.log('User soft deleted:', deletedUser.username)
   * console.log('Deleted at:', deletedUser.deleted_at)
   * ```
   */
  async softDeleteUser(userId: string): Promise<typeof users.$inferSelect> {
    const existingUser = await this.getUserById(userId)
    if (!existingUser)
      throw new Error('User not found')

    try {
      const [updated] = await this.db
        .update(users)
        .set({ is_deleted: true, deleted_at: new Date() })
        .where(eq(users.id, userId))
        .returning()

      this.logger.info('User soft deleted successfully', {
        user_id: userId,
        username: existingUser.username,
        timestamp: new Date().toISOString(),
      })

      return updated
    }
    catch (error) {
      this.logger.error('Soft delete operation failed', {
        user_id: userId,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Restores a soft-deleted user by clearing the is_deleted flag and deleted_at timestamp
   *
   * This method reverses a soft delete operation, making the user active again.
   * The user will be able to log in and access the system normally.
   *
   * @param userId - The ID of the user to restore
   *
   * @returns Promise resolving to the restored user record
   *
   * @throws {Error} When user is not found
   * @throws {Error} When database update fails
   *
   * @example
   * ```typescript
   * const restoredUser = await userService.restoreUser('user123')
   * console.log('User restored:', restoredUser.username)
   * console.log('Is deleted:', restoredUser.is_deleted) // false
   * ```
   */
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

  /**
   * Retrieves a user by ID with their associated role data
   *
   * This method fetches the user record and includes the appropriate role-specific data
   * based on the user's type (teacher, admin, or technical_staff).
   * Only returns non-deleted users.
   *
   * @param userId - The ID of the user to retrieve
   *
   * @returns Promise resolving to user with role data or null if not found
   * @returns user - Base user information
   * @returns user.teacher - Teacher profile data (if user_type is 'teacher')
   * @returns user.admin - Admin profile data (if user_type is 'admin')
   * @returns user.technical_staff - Technical staff profile data (if user_type is 'technical_staff')
   *
   * @example
   * ```typescript
   * const user = await userService.getUserById('user123')
   * if (user) {
   *   console.log('User:', user.username)
   *   if (user.teacher) {
   *     console.log('Teacher name:', user.teacher.firstname, user.teacher.lastname)
   *   }
   * }
   * ```
   */
  async getUserById(userId: string): Promise<UserWithRole | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.is_deleted, false)))
      .limit(1)
    if (!user) {
      return null
    }

    let roleData: any = null

    switch (user.user_type) {
      case 'teacher':
        [roleData] = await this.db.select().from(teachers).where(eq(teachers.user_id, userId)).limit(1)
        return { ...user, teacher: roleData || null }
      case 'technical_staff':
        [roleData] = await this.db.select().from(technical_staff).where(eq(technical_staff.user_id, userId)).limit(1)
        return { ...user, technical_staff: roleData || null }
      case 'admin':
        [roleData] = await this.db.select().from(admins).where(eq(admins.user_id, userId)).limit(1)
        return { ...user, admin: roleData || null }
      default:
        return user
    }
  }

  /**
   * Lists users with pagination support
   *
   * This method retrieves a paginated list of users with metadata about the pagination state.
   * Results are ordered by creation date (newest first).
   *
   * @param params - Pagination parameters
   * @param params.page - Page number (1-based)
   * @param params.limit - Number of users per page
   *
   * @returns Promise resolving to paginated users and pagination metadata
   * @returns result.users - Array of user records for the current page
   * @returns result.pagination - Pagination metadata
   * @returns result.pagination.page - Current page number
   * @returns result.pagination.limit - Items per page
   * @returns result.pagination.total - Total number of users
   * @returns result.pagination.totalPages - Total number of pages
   * @returns result.pagination.hasNext - Whether there are more pages
   * @returns result.pagination.hasPrev - Whether there are previous pages
   *
   * @example
   * ```typescript
   * const result = await userService.listUsers({ page: 1, limit: 10 })
   * console.log(`Page ${result.pagination.page} of ${result.pagination.totalPages}`)
   * console.log(`Found ${result.users.length} users`)
   *
   * if (result.pagination.hasNext) {
   *   console.log('More users available on next page')
   * }
   * ```
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
   * Retrieves all users without pagination
   *
   * This method fetches all user records from the database. Use with caution
   * on large datasets as it may impact performance. Consider using listUsers()
   * with pagination for better performance.
   *
   * @returns Promise resolving to array of all user records
   *
   * @example
   * ```typescript
   * const allUsers = await userService.getAllUsers()
   * console.log(`Total users in system: ${allUsers.length}`)
   *
   * // Filter by user type
   * const teachers = allUsers.filter(user => user.user_type === 'teacher')
   * console.log(`Teachers: ${teachers.length}`)
   * ```
   *
   * @deprecated Consider using listUsers() with pagination for better performance
   */
  async getAllUsers(): Promise<Array<typeof users.$inferSelect>> {
    const allUsers = await this.db.select().from(users)
    return allUsers
  }
}
