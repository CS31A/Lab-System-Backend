/**
 * @fileoverview StudentService - Core business logic for student management
 * Handles student data retrieval and operations
 */

import type { Context } from 'hono'
import { count, eq } from 'drizzle-orm'
import { createDb, createServerlessDb } from '@/db'
import { students } from '@/db/schema'
import type { InferInsertModel } from 'drizzle-orm'

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
}