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
  labSessionId: string
  scheduleId: string | null
  labId: string
  labName: string
  status: string
  sessionStartTime: Date | null
  sessionEndTime: Date | null
}

export interface TeacherDashboardResult {
  schedules: ScheduleWithDetails[]
  currentLabSession: ActiveActivity | null
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
   * @param {ListTeachersParams} params - The pagination parameters
   * @returns {Promise<ListTeachersResult>} The list of teachers with pagination metadata
   * @throws {Error} If the retrieval fails
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
   * @returns {Promise<Array<typeof teachers.$inferSelect>>} All teacher records
   * @throws {Error} If the retrieval fails
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
   * @param {TeacherDashboardParams} params - The parameters for retrieving dashboard data
   * @returns {Promise<TeacherDashboardResult>} The teacher dashboard data
   * @throws {Error} If the retrieval fails
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
          labSessionId: lab_activity_log.id,
          scheduleId: lab_activity_log.schedule_id,
          labId: lab_activity_log.laboratory_id,
          labName: laboratory.name,
          status: lab_activity_log.status,
          sessionStartTime: lab_activity_log.time_in,
          sessionEndTime: lab_activity_log.time_out,
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
      const [teacherExists, schedulesResult, currentLabSessionResult] = await Promise.all([
        teacherValidationQuery,
        schedulesQuery,
        activeActivityQuery,
      ])

      // Validate teacher exists after parallel execution
      if (!teacherExists.length) {
        throw new Error(`Teacher does not exist`)
      }

      const result: TeacherDashboardResult = {
        schedules: schedulesResult,
        currentLabSession: currentLabSessionResult[0] || null,
      }

      this.logger.info('Teacher dashboard data retrieved successfully', {
        teacherId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        schedulesCount: schedulesResult.length,
        hasCurrentLabSession: !!result.currentLabSession,
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

  /**
   * Retrieves all laboratories with their current status
   * Determines if a lab is available, occupied, or under maintenance
   * @returns {Promise<any[]>} The list of laboratories with their current status
   * @throws {Error} If the retrieval fails
   */
  async getLaboratoriesWithCurrentStatus() {
    try {
      const now = new Date()
      // Get all laboratories with their current schedules (if any)
      const laboratoriesWithSchedules = await this.db
        .select({
          id: laboratory.id,
          name: laboratory.name,
          status: laboratory.status,
          created_at: laboratory.created_at,
          updated_at: laboratory.updated_at,
          // Schedule information (if currently active)
          scheduleId: schedule.id,
          section: schedule.section,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          scheduleStatus: schedule.status,
          // Subject and teacher information
          subjectName: subjects.subject_name,
          teacherFirstname: teachers.firstname,
          teacherLastname: teachers.lastname,
        })
        .from(laboratory)
        .leftJoin(
          schedule,
          and(
            eq(laboratory.id, schedule.laboratory_id),
            lte(schedule.start_time, now),
            gte(schedule.end_time, now),
          ),
        )
        .leftJoin(subjects, eq(schedule.subject_id, subjects.id))
        .leftJoin(teachers, eq(schedule.teacher_id, teachers.id))
        .orderBy(laboratory.name)

      // Transform the data to include current status
      const laboratoriesWithVacancy = laboratoriesWithSchedules.map((lab) => {
        let vacancyStatus: 'available' | 'occupied' | 'maintenance'
        let currentSchedule = null

        // Determine current status
        if (!lab.status) {
          vacancyStatus = 'maintenance' // Laboratory is unavailable/under maintenance
        }
        else if (lab.scheduleId && lab.startTime && lab.endTime) {
          vacancyStatus = 'occupied' // Laboratory has an active schedule
          currentSchedule = {
            id: lab.scheduleId,
            section: lab.section || '',
            start_time: lab.startTime.toISOString(),
            end_time: lab.endTime.toISOString(),
            subject_name: lab.subjectName || '',
            teacher_name: `${lab.teacherFirstname || ''} ${lab.teacherLastname || ''}`.trim() || 'Unknown',
          }
        }
        else {
          vacancyStatus = 'available' // Laboratory is available
        }

        return {
          id: lab.id,
          name: lab.name,
          status: lab.status,
          vacancy_status: vacancyStatus,
          current_schedule: currentSchedule,
          created_at: lab.created_at.toISOString(),
          updated_at: lab.updated_at.toISOString(),
        }
      })

      this.logger.info('Laboratories with current status retrieved successfully', {
        totalLaboratories: laboratoriesWithVacancy.length,
        available: laboratoriesWithVacancy.filter(lab => lab.vacancy_status === 'available').length,
        occupied: laboratoriesWithVacancy.filter(lab => lab.vacancy_status === 'occupied').length,
        maintenance: laboratoriesWithVacancy.filter(lab => lab.vacancy_status === 'maintenance').length,
        timestamp: new Date().toISOString(),
      })

      return laboratoriesWithVacancy
    }
    catch (error) {
      this.logger.error('Failed to retrieve laboratories with current status', {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves all schedules for a specific laboratory
   * @param {string} labId - The laboratory ID
   * @returns {Promise<any[]>} The list of schedules for the laboratory
   * @throws {Error} If the retrieval fails or laboratory not found
   */
  async getLabScheduleById(labId: string) {
    try {
      // Verify laboratory exists
      const [labExists] = await this.db
        .select({ id: laboratory.id, name: laboratory.name })
        .from(laboratory)
        .where(eq(laboratory.id, labId))
        .limit(1)

      if (!labExists) {
        throw new Error('Laboratory not found')
      }

      // Get all schedules for the laboratory with related information
      const schedules = await this.db
        .select({
          id: schedule.id,
          section: schedule.section,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          status: schedule.status,
          created_at: schedule.created_at,
          updated_at: schedule.updated_at,
          subject: {
            id: subjects.id,
            name: subjects.subject_name,
            code: subjects.subject_code,
          },
          teacher: {
            id: teachers.id,
            firstname: teachers.firstname,
            lastname: teachers.lastname,
          },
          laboratory: {
            id: laboratory.id,
            name: laboratory.name,
          },
        })
        .from(schedule)
        .innerJoin(subjects, eq(schedule.subject_id, subjects.id))
        .innerJoin(teachers, eq(schedule.teacher_id, teachers.id))
        .innerJoin(laboratory, eq(schedule.laboratory_id, laboratory.id))
        .where(eq(schedule.laboratory_id, labId))
        .orderBy(schedule.start_time)

      this.logger.info('Laboratory schedules retrieved successfully', {
        laboratoryId: labId,
        laboratoryName: labExists.name,
        schedulesCount: schedules.length,
        timestamp: new Date().toISOString(),
      })

      return schedules
    }
    catch (error) {
      this.logger.error('Failed to retrieve laboratory schedules', {
        error: (error as Error).message,
        laboratoryId: labId,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Checks the availability status of a specific laboratory
   * @param {string} labId - The laboratory ID
   * @returns {Promise<any>} The availability status of the laboratory
   * @throws {Error} If the retrieval fails or laboratory not found
   */
  async getLabAvailability(labId: string) {
    try {
      const now = new Date()

      // Get laboratory with current schedule (if any)
      const [labWithSchedule] = await this.db
        .select({
          id: laboratory.id,
          name: laboratory.name,
          status: laboratory.status,
          created_at: laboratory.created_at,
          updated_at: laboratory.updated_at,
          // Current schedule information (if active)
          scheduleId: schedule.id,
          section: schedule.section,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          scheduleStatus: schedule.status,
          // Subject and teacher information
          subjectName: subjects.subject_name,
          subjectCode: subjects.subject_code,
          teacherFirstname: teachers.firstname,
          teacherLastname: teachers.lastname,
        })
        .from(laboratory)
        .leftJoin(
          schedule,
          and(
            eq(laboratory.id, schedule.laboratory_id),
            lte(schedule.start_time, now),
            gte(schedule.end_time, now),
          ),
        )
        .leftJoin(subjects, eq(schedule.subject_id, subjects.id))
        .leftJoin(teachers, eq(schedule.teacher_id, teachers.id))
        .where(eq(laboratory.id, labId))
        .limit(1)

      if (!labWithSchedule) {
        throw new Error('Laboratory not found')
      }

      // Determine availability status
      let availabilityStatus: 'available' | 'occupied' | 'maintenance'
      let currentSchedule = null
      let isAvailable = false

      if (!labWithSchedule.status) {
        availabilityStatus = 'maintenance'
        isAvailable = false
      }
      else if (labWithSchedule.scheduleId && labWithSchedule.startTime && labWithSchedule.endTime) {
        availabilityStatus = 'occupied'
        isAvailable = false
        currentSchedule = {
          id: labWithSchedule.scheduleId,
          section: labWithSchedule.section || '',
          start_time: labWithSchedule.startTime.toISOString(),
          end_time: labWithSchedule.endTime.toISOString(),
          status: labWithSchedule.scheduleStatus,
          subject: {
            name: labWithSchedule.subjectName || '',
            code: labWithSchedule.subjectCode || '',
          },
          teacher: {
            name: `${labWithSchedule.teacherFirstname || ''} ${labWithSchedule.teacherLastname || ''}`.trim() || 'Unknown',
          },
        }
      }
      else {
        availabilityStatus = 'available'
        isAvailable = true
      }

      const result = {
        laboratory: {
          id: labWithSchedule.id,
          name: labWithSchedule.name,
          status: labWithSchedule.status,
        },
        is_available: isAvailable,
        availability_status: availabilityStatus,
        current_schedule: currentSchedule,
        checked_at: now.toISOString(),
      }

      this.logger.info('Laboratory availability checked successfully', {
        laboratoryId: labId,
        laboratoryName: labWithSchedule.name,
        availabilityStatus,
        isAvailable,
        timestamp: now.toISOString(),
      })

      return result
    }
    catch (error) {
      this.logger.error('Failed to check laboratory availability', {
        error: (error as Error).message,
        laboratoryId: labId,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }
}
