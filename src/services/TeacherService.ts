/**
 * @fileoverview TeacherService - Core business logic for teacher management
 * Handles teacher data retrieval, pagination, and business operations
 */

import type { Context } from 'hono'
import { count } from 'drizzle-orm'
import { createDb } from '@/db'
import { teachers } from '@/db/schema'

export interface ListTeachersParams {
  page: number
  limit: number
}

export interface ListTeachersResult {
  teachers: Array<typeof teachers.$inferSelect>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class TeacherService {
  private db: ReturnType<typeof createDb>
  private logger: any

  constructor(c: Context) {
    this.db = createDb(c)
    this.logger = c.var.logger
  }

  /**
   * Lists teachers with pagination
   * Retrieves paginated list of teachers from the database with metadata
   */
  async listTeachers(params: ListTeachersParams): Promise<ListTeachersResult> {
    const { page, limit } = params
    const offset = (page - 1) * limit

    try {
      const [totalResult, teachersData] = await Promise.all([
        this.db.select({ count: count() })
          .from(teachers),
        this.db
          .select()
          .from(teachers)
          .limit(limit)
          .offset(offset)
          .orderBy(teachers.created_at),
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

      this.logger.info('Teachers list retrieved successfully', {
        page,
        limit,
        total,
        totalPages,
        returned_count: teachersData.length,
        timestamp: new Date().toISOString(),
      })

      return {
        teachers: teachersData,
        pagination,
      }
    }
    catch (error) {
      this.logger.error('Failed to retrieve teachers list', {
        error: (error as Error).message,
        page,
        limit,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves all teachers without pagination
   * Useful for administrative operations or exports
   */
  async getAllTeachers(): Promise<Array<typeof teachers.$inferSelect>> {
    try {
      const allTeachers = await this.db
        .select()
        .from(teachers)
        .orderBy(teachers.created_at)

      this.logger.info('All teachers retrieved successfully', {
        count: allTeachers.length,
        timestamp: new Date().toISOString(),
      })

      return allTeachers
    }
    catch (error) {
      this.logger.error('Failed to retrieve all teachers', {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }
}
