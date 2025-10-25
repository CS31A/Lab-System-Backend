/**
 * @fileoverview StudentService - Core business logic for student management
 * Handles student data retrieval and operations
 */

import type { Context } from 'hono'
import { count, eq } from 'drizzle-orm'
import { createDb, createServerlessDb } from '@/db'
import { students } from '@/db/schema'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

export interface ListStudentsParams {
  page: number
  limit: number
}

export interface ListStudentsResult {
  students: Array<typeof students.$inferSelect>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class StudentService {
  private db: ReturnType<typeof createDb>
  private serverlessDb: ReturnType<typeof createServerlessDb>
  private logger: any

  constructor(c: Context) {
    this.db = createDb(c)
    this.serverlessDb = createServerlessDb(c)
    this.logger = c.var.logger
  }

  /**
   * Creates a new student
   * @param {InferInsertModel<typeof students>} data - The student data to create
   * @returns {Promise<(typeof students.$inferSelect)>} The created student record
   * @throws {Error} If the creation fails
   */
  async createStudent(data: InferInsertModel<typeof students>) {
    try {
      const [newStudent] = await this.db
        .insert(students)
        .values(data)
        .returning()

      this.logger.info('Student created successfully', {
        studentId: newStudent.id,
        studentName: `${newStudent.firstname} ${newStudent.lastname}`,
        timestamp: new Date().toISOString(),
      })

      return newStudent
    }
    catch (error) {
      this.logger.error('Failed to create student', {
        error: (error as Error).message,
        studentData: data,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves a student by ID
   * @param {string} id - The unique identifier of the student
   * @returns {Promise<(typeof students.$inferSelect) | null>} The student record if found, null otherwise
   * @throws {Error} If the retrieval fails
   */
  async getStudentById(id: string) {
    try {
      const [student] = await this.db
        .select()
        .from(students)
        .where(eq(students.id, id))
        .limit(1)

      return student || null
    }
    catch (error) {
      this.logger.error('Failed to retrieve student', {
        error: (error as Error).message,
        studentId: id,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Lists students with pagination
   * @param {ListStudentsParams} params - The pagination parameters
   * @returns {Promise<ListStudentsResult>} The list of students with pagination metadata
   * @throws {Error} If the retrieval fails
   */
  async listStudents(params: ListStudentsParams): Promise<ListStudentsResult> {
    const { page, limit } = params
    const offset = (page - 1) * limit

    try {
      // Use transaction to ensure consistency between count and select queries
      const result = await this.serverlessDb.transaction(async (tx) => {
        const [totalResult, studentsData] = await Promise.all([
          tx.select({ count: count() })
            .from(students),
          tx
            .select()
            .from(students)
            .limit(limit)
            .offset(offset)
            .orderBy(students.created_at),
        ])

        const total = totalResult[0]?.count || 0
        const totalPages = Math.ceil(total / limit) || 1

        // Calculate pagination metadata
        const pagination = {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }

        return {
          students: studentsData,
          pagination,
        }
      })

      this.logger.info('Students list retrieved successfully', {
        page,
        limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        returned_count: result.students.length,
        timestamp: new Date().toISOString(),
      })

      return result
    }
    catch (error) {
      this.logger.error('Failed to retrieve students list', {
        error: (error as Error).message,
        page,
        limit,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves all students without pagination
   * @returns {Promise<Array<typeof students.$inferSelect>>} All student records
   * @throws {Error} If the retrieval fails
   */
  async getAllStudents() {
    try {
      const allStudents = await this.db
        .select()
        .from(students)
        .orderBy(students.created_at)

      this.logger.info('All students retrieved successfully', {
        count: allStudents.length,
        timestamp: new Date().toISOString(),
      })

      return allStudents
    }
    catch (error) {
      this.logger.error('Failed to retrieve all students', {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Updates an existing student's information
   *
   * This method updates the student record with the provided data.
   * It validates that the student exists before performing the update.
   *
   * @param {string} id - The ID of the student to update
   * @param {Partial<InferInsertModel<typeof students>>} updateData - Partial student data to update
   *
   * @returns {Promise<InferSelectModel<typeof students>>} The updated student record
   *
   * @throws {Error} When student is not found
   * @throws {Error} When database update fails
   *
   * @example
   * ```typescript
   * const updatedStudent = await studentService.updateStudent('student123', {
   *   firstname: 'Jane',
   *   lastname: 'Smith',
   *   section: 'CS101-B'
   * })
   * console.log('Student updated:', updatedStudent.student_id)
   * ```
   */
  async updateStudent(id: string, updateData: Partial<InferInsertModel<typeof students>>): Promise<InferSelectModel<typeof students>> {
    // First, check if student exists
    const existingStudent = await this.getStudentById(id)
    if (!existingStudent) {
      throw new Error('Student not found')
    }

    try {
      const [updated] = await this.db
        .update(students)
        .set(updateData)
        .where(eq(students.id, id))
        .returning()

      this.logger.info('Student updated successfully', {
        student_id: id,
        updated_fields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      })

      return updated
    }
    catch (error) {
      this.logger.error('Student update failed', {
        student_id: id,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Soft deletes a student by setting is_deleted flag and deleted_at timestamp
   *
   * This method marks a student as deleted without actually removing the record from the database.
   * This allows for data recovery and maintains referential integrity with related records.
   *
   * @param {string} id - The ID of the student to soft delete
   *
   * @returns {Promise<InferSelectModel<typeof students>>} The updated student record
   *
   * @throws {Error} When student is not found
   * @throws {Error} When database update fails
   *
   * @example
   * ```typescript
   * const deletedStudent = await studentService.softDeleteStudent('student123')
   * console.log('Student soft deleted:', deletedStudent.student_id)
   * console.log('Deleted at:', deletedStudent.deleted_at)
   * ```
   */
  async softDeleteStudent(id: string): Promise<InferSelectModel<typeof students>> {
    const existingStudent = await this.getStudentById(id)
    if (!existingStudent)
      throw new Error('Student not found')

    try {
      const [updated] = await this.db
        .update(students)
        .set({ is_deleted: true, deleted_at: new Date() })
        .where(eq(students.id, id))
        .returning()

      this.logger.info('Student soft deleted successfully', {
        student_id: id,
        student_name: `${existingStudent.firstname} ${existingStudent.lastname}`,
        timestamp: new Date().toISOString(),
      })

      return updated
    }
    catch (error) {
      this.logger.error('Soft delete operation failed', {
        student_id: id,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Permanently deletes a student from the database
   *
   * This method performs a hard delete operation that completely removes the student
   * from the database. This operation cannot be undone.
   * Use with extreme caution as this will permanently destroy student data.
   *
   * @param {string} id - The ID of the student to permanently delete
   *
   * @returns {Promise<void>} Promise that resolves when deletion is complete
   *
   * @throws {Error} When student is not found
   * @throws {Error} When database deletion fails
   *
   * @example
   * ```typescript
   * try {
   *   await studentService.hardDeleteStudent('student123')
   *   console.log('Student permanently deleted')
   * } catch (error) {
   *   if (error.message === 'Student not found') {
   *     console.log('Student does not exist')
   *   } else {
   *     console.error('Deletion failed:', error.message)
   *   }
   * }
   * ```
   *
   * @warning This operation is irreversible. Consider using softDeleteStudent() instead
   * for most use cases to maintain data integrity and allow for recovery.
   */
  async hardDeleteStudent(id: string): Promise<void> {
    // First, check if student exists and get their data
    const existingStudent = await this.getStudentById(id)
    if (!existingStudent) {
      throw new Error('Student not found')
    }

    try {
      await this.db
        .delete(students)
        .where(eq(students.id, id))
        .returning()

      this.logger.info('Student permanently deleted successfully', {
        student_id: id,
        student_name: `${existingStudent.firstname} ${existingStudent.lastname}`,
        timestamp: new Date().toISOString(),
      })
    }
    catch (error) {
      this.logger.error('Hard delete operation failed', {
        student_id: id,
        student_name: `${existingStudent.firstname} ${existingStudent.lastname}`,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })

      throw error
    }
  }
}