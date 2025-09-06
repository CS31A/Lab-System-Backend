/**
 * @fileoverview SubjectService - Core business logic for subject management
 * Handles subject data retrieval, creation, updates, and deletion
 */

import type { Context } from 'hono'
import { count, eq } from 'drizzle-orm'
import { createDb, createServerlessDb } from '@/db'
import { subjects } from '@/db/schema'

export interface CreateSubjectData {
  subject_name: string
  subject_code: string
}

export interface UpdateSubjectData {
  subject_name?: string
  subject_code?: string
}

export interface ListSubjectsParams {
  page: number
  limit: number
}

export interface ListSubjectsResult {
  subjects: Array<typeof subjects.$inferSelect>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class SubjectService {
  private db: ReturnType<typeof createDb>
  private serverlessDb: ReturnType<typeof createServerlessDb>
  private logger: any

  constructor(c: Context) {
    this.db = createDb(c)
    this.serverlessDb = createServerlessDb(c)
    this.logger = c.var.logger
  }

  /**
   * Creates a new subject
   */
  async createSubject(subjectData: CreateSubjectData) {
    try {
      const [createdSubject] = await this.db
        .insert(subjects)
        .values(subjectData)
        .returning()

      this.logger.info('Subject created successfully', {
        subjectId: createdSubject.id,
        subjectCode: createdSubject.subject_code,
        timestamp: new Date().toISOString(),
      })

      return createdSubject
    }
    catch (error) {
      this.logger.error('Failed to create subject', {
        error: (error as Error).message,
        subjectData,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves a subject by ID
   */
  async getSubjectById(id: string) {
    try {
      const [subject] = await this.db
        .select()
        .from(subjects)
        .where(eq(subjects.id, id))
        .limit(1)

      return subject || null
    }
    catch (error) {
      this.logger.error('Failed to retrieve subject', {
        error: (error as Error).message,
        subjectId: id,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Updates a subject by ID
   */
  async updateSubject(id: string, updateData: UpdateSubjectData) {
    try {
      // First check if subject exists
      const existingSubject = await this.getSubjectById(id)
      if (!existingSubject) {
        throw new Error('Subject not found')
      }

      // Update the subject
      const [updatedSubject] = await this.db
        .update(subjects)
        .set(updateData)
        .where(eq(subjects.id, id))
        .returning()

      this.logger.info('Subject updated successfully', {
        subjectId: id,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      })

      return updatedSubject
    }
    catch (error) {
      this.logger.error('Failed to update subject', {
        error: (error as Error).message,
        subjectId: id,
        updateData,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Deletes a subject by ID
   */
  async deleteSubject(id: string) {
    try {
      // First check if subject exists
      const existingSubject = await this.getSubjectById(id)
      if (!existingSubject) {
        throw new Error('Subject not found')
      }

      // Delete the subject
      const [deletedSubject] = await this.db
        .delete(subjects)
        .where(eq(subjects.id, id))
        .returning()

      this.logger.info('Subject deleted successfully', {
        subjectId: id,
        subjectCode: deletedSubject.subject_code,
        timestamp: new Date().toISOString(),
      })

      return deletedSubject
    }
    catch (error) {
      this.logger.error('Failed to delete subject', {
        error: (error as Error).message,
        subjectId: id,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Lists subjects with pagination
   */
  async listSubjects(params: ListSubjectsParams): Promise<ListSubjectsResult> {
    const { page, limit } = params
    const offset = (page - 1) * limit

    try {
      // Use transaction to ensure consistency between count and select queries
      const result = await this.serverlessDb.transaction(async (tx) => {
        const [totalResult, subjectsData] = await Promise.all([
          tx.select({ count: count() })
            .from(subjects),
          tx
            .select()
            .from(subjects)
            .limit(limit)
            .offset(offset)
            .orderBy(subjects.created_at),
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
          subjects: subjectsData,
          pagination,
        }
      })

      this.logger.info('Subjects list retrieved successfully', {
        page,
        limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
        returned_count: result.subjects.length,
        timestamp: new Date().toISOString(),
      })

      return result
    }
    catch (error) {
      this.logger.error('Failed to retrieve subjects list', {
        error: (error as Error).message,
        page,
        limit,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves all subjects without pagination
   */
  async getAllSubjects() {
    try {
      const allSubjects = await this.db
        .select()
        .from(subjects)
        .orderBy(subjects.created_at)

      this.logger.info('All subjects retrieved successfully', {
        count: allSubjects.length,
        timestamp: new Date().toISOString(),
      })

      return allSubjects
    }
    catch (error) {
      this.logger.error('Failed to retrieve all subjects', {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }
}
