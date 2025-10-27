/**
 * @fileoverview ScheduleService - Core business logic for schedule management
 * Handles schedule data retrieval, creation, updates, and deletion
 */

import type { Context } from 'hono'
import { count, eq } from 'drizzle-orm'
import { createDb, createServerlessDb } from '@/db'
import { schedule } from '@/db/schema'

export interface CreateScheduleData {
  laboratory_id: string
  teacher_id: string
  subject_id: string
  section: string
  start_time: Date
  end_time: Date
  status?: string | null
}

export interface UpdateScheduleData {
  laboratory_id?: string
  teacher_id?: string
  subject_id?: string
  section?: string
  start_time?: Date
  end_time?: Date
  status?: string | null
}

export interface ListSchedulesParams {
  page: number
  limit: number
}

export interface ListSchedulesResult {
  schedules: Array<typeof schedule.$inferSelect>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class ScheduleService {
  private db: ReturnType<typeof createDb>
  private serverlessDb: ReturnType<typeof createServerlessDb>
  private logger: any

  constructor(c: Context) {
    this.db = createDb(c)
    this.serverlessDb = createServerlessDb(c)
    this.logger = c.var.logger
  }

  /**
   * Creates a new schedule
   * @param {CreateScheduleData} scheduleData - The data for creating the schedule
   * @returns {Promise<typeof schedule.$inferSelect>} The created schedule record
   * @throws {Error} If the schedule creation fails
   */
  async createSchedule(scheduleData: CreateScheduleData) {
    try {
      const [createdSchedule] = await this.db
        .insert(schedule)
        .values(scheduleData)
        .returning()

      this.logger.info('Schedule created successfully', {
        scheduleId: createdSchedule.id,
        laboratoryId: createdSchedule.laboratory_id,
        teacherId: createdSchedule.teacher_id,
        subjectId: createdSchedule.subject_id,
        section: createdSchedule.section,
        timestamp: new Date().toISOString(),
      })

      return createdSchedule
    }
    catch (error) {
      this.logger.error('Failed to create schedule', {
        error: (error as Error).message,
        scheduleData,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves a schedule by ID
   * @param {string} id - The unique identifier of the schedule
   * @returns {Promise<(typeof schedule.$inferSelect) | null>} The schedule record if found, null otherwise
   * @throws {Error} If the retrieval fails
   */
  async getScheduleById(id: string) {
    try {
      const [scheduleRecord] = await this.db
        .select()
        .from(schedule)
        .where(eq(schedule.id, id))
        .limit(1)

      return scheduleRecord || null
    }
    catch (error) {
      this.logger.error('Failed to retrieve schedule', {
        error: (error as Error).message,
        scheduleId: id,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Updates a schedule by ID
   * @param {string} id - The unique identifier of the schedule to update
   * @param {UpdateScheduleData} updateData - The data to update the schedule with
   * @returns {Promise<typeof schedule.$inferSelect>} The updated schedule record
   * @throws {Error} If the update fails or if the schedule is not found
   */
  async updateSchedule(id: string, updateData: UpdateScheduleData) {
    try {
      const [updatedSchedule] = await this.db
        .update(schedule)
        .set(updateData)
        .where(eq(schedule.id, id))
        .returning()

      if (!updatedSchedule) {
        throw new Error('Schedule not found')
      }

      this.logger.info('Schedule updated successfully', {
        scheduleId: id,
        updatedFields: Object.keys(updateData).filter(k => updateData[k as keyof UpdateScheduleData] !== undefined),
        timestamp: new Date().toISOString(),
      })

      return updatedSchedule
    }
    catch (error) {
      this.logger.error('Failed to update schedule', {
        error: (error as Error).message,
        scheduleId: id,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Deletes a schedule by ID
   * @param {string} id - The unique identifier of the schedule to delete
   * @returns {Promise<typeof schedule.$inferSelect>} The deleted schedule record
   * @throws {Error} If the deletion fails or if the schedule is not found
   */
  async deleteSchedule(id: string) {
    try {
      const [deletedSchedule] = await this.db
        .delete(schedule)
        .where(eq(schedule.id, id))
        .returning()

      if (!deletedSchedule) {
        throw new Error('Schedule not found')
      }

      this.logger.info('Schedule deleted successfully', {
        scheduleId: id,
        laboratoryId: deletedSchedule.laboratory_id,
        timestamp: new Date().toISOString(),
      })

      return deletedSchedule
    }
    catch (error) {
      this.logger.error('Failed to delete schedule', {
        error: (error as Error).message,
        scheduleId: id,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Lists schedules with pagination
   * @param {ListSchedulesParams} params - The pagination parameters
   * @returns {Promise<ListSchedulesResult>} The list of schedules with pagination metadata
   * @throws {Error} If the retrieval fails
   */
  async listSchedules(params: ListSchedulesParams): Promise<ListSchedulesResult> {
    const { page, limit } = params
    const offset = (page - 1) * limit

    try {
      const [totalResult, schedulesData] = await Promise.all([
        this.db.select({ count: count() }).from(schedule),
        this.db
          .select()
          .from(schedule)
          .limit(limit)
          .offset(offset)
          .orderBy(schedule.created_at),
      ])

      const total = totalResult[0]?.count || 0
      const totalPages = Math.ceil(total / limit) || 1

      const pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }

      this.logger.info('Schedules list retrieved successfully', {
        page,
        limit,
        total,
        totalPages,
        returned_count: schedulesData.length,
        timestamp: new Date().toISOString(),
      })

      return {
        schedules: schedulesData,
        pagination,
      }
    }
    catch (error) {
      this.logger.error('Failed to retrieve schedules list', {
        error: (error as Error).message,
        page,
        limit,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }
}
