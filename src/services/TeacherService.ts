/**
 * @fileoverview TeacherService - Core business logic for teacher management
 * Handles teacher data retrieval, pagination, and business operations
 */

import type { Context } from 'hono'
import { and, count, eq, gte, isNull, lte } from 'drizzle-orm'
import { createDb } from '@/db'
import { lab_activity_log, laboratory, schedule, subjects, teachers } from '@/db/schema'

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

export interface TeacherDashboardParams {
  teacherId: string
  startDate?: Date
  endDate?: Date
}

export interface ScheduleWithDetails {
  scheduleId: string
  labId: string
  subjectCode: string
  subjectName: string
  section: string
  labName: string
  startTime: Date
  endTime: Date
  status: string | null
}

export interface ActiveActivity {
  activityId: string
  scheduleId: string | null
  labId: string
  labName: string
  status: string
  timeIn: Date | null
  timeOut: Date | null
}

export interface TeacherDashboardResult {
  schedules: ScheduleWithDetails[]
  activeActivity: ActiveActivity | null
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

  /**
   * Retrieves teacher dashboard data including schedules and active lab activities
   * Returns schedules within the specified date range and any currently active lab activity
   */
  async getTeacherDashboard(params: TeacherDashboardParams): Promise<TeacherDashboardResult> {
    const { teacherId, startDate, endDate } = params

    try {
      // Build date filter conditions
      const dateConditions: any[] = []
      if (startDate) {
        dateConditions.push(gte(schedule.start_time, startDate))
      }
      if (endDate) {
        dateConditions.push(lte(schedule.end_time, endDate))
      }

      // Combine teacher filter with optional date filters
      const whereConditions = [
        eq(schedule.teacher_id, teacherId),
        ...dateConditions,
      ]

      // Prepare all queries for parallel execution
      const teacherValidationQuery = this.db
        .select({ id: teachers.id })
        .from(teachers)
        .where(eq(teachers.id, teacherId))
        .limit(1)

      const schedulesQuery = this.db
        .select({
          scheduleId: schedule.id,
          labId: schedule.laboratory_id,
          subjectCode: subjects.subject_code,
          subjectName: subjects.subject_name,
          section: schedule.section,
          labName: laboratory.name,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          status: schedule.status,
        })
        .from(schedule)
        .innerJoin(subjects, eq(schedule.subject_id, subjects.id))
        .innerJoin(laboratory, eq(schedule.laboratory_id, laboratory.id))
        .where(and(...whereConditions))
        .orderBy(schedule.start_time)

      const activeActivityQuery = this.db
        .select({
          activityId: lab_activity_log.id,
          scheduleId: lab_activity_log.schedule_id,
          labId: lab_activity_log.laboratory_id,
          labName: laboratory.name,
          status: lab_activity_log.status,
          timeIn: lab_activity_log.time_in,
          timeOut: lab_activity_log.time_out,
        })
        .from(lab_activity_log)
        .innerJoin(laboratory, eq(lab_activity_log.laboratory_id, laboratory.id))
        .innerJoin(schedule, eq(lab_activity_log.schedule_id, schedule.id))
        .where(
          and(
            eq(schedule.teacher_id, teacherId),
            isNull(lab_activity_log.time_out),
          ),
        )
        .limit(1)

      // Execute all queries in parallel for better performance
      const [teacherExists, schedulesResult, activeActivityResult] = await Promise.all([
        teacherValidationQuery,
        schedulesQuery,
        activeActivityQuery,
      ])

      // Validate teacher exists after parallel execution
      if (!teacherExists.length) {
        throw new Error(`Teacher with ID ${teacherId} not found`)
      }

      const result: TeacherDashboardResult = {
        schedules: schedulesResult,
        activeActivity: activeActivityResult[0] || null,
      }

      this.logger.info('Teacher dashboard data retrieved successfully', {
        teacherId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        schedulesCount: schedulesResult.length,
        hasActiveActivity: !!result.activeActivity,
        timestamp: new Date().toISOString(),
      })

      return result
    }
    catch (error) {
      this.logger.error('Failed to retrieve teacher dashboard data', {
        error: (error as Error).message,
        teacherId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }
}
