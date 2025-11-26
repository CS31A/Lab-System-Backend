/**
 * @fileoverview TeacherService - Core business logic for teacher management
 * Handles teacher data retrieval, pagination, and business operations
 */

import type { Context } from 'hono'
import { and, count, eq, gte, inArray, isNull, lte } from 'drizzle-orm'
import { createDb } from '@/db'
import { lab_activity_log, laboratory, schedule, seating_plan, students, subjects, teachers } from '@/db/schema'

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

  /**
   * Retrieves all students enrolled in a specific schedule
   * @param {string} scheduleId - The schedule ID
   * @returns {Promise<any[]>} The list of students with their seating information
   * @throws {Error} If the retrieval fails or schedule not found
   */
  async getScheduleStudents(scheduleId: string) {
    try {
      // Verify schedule exists
      const [scheduleExists] = await this.db
        .select({ id: schedule.id })
        .from(schedule)
        .where(eq(schedule.id, scheduleId))
        .limit(1)

      if (!scheduleExists) {
        throw new Error('Schedule not found')
      }

      // Get all students in the schedule via seating_plan
      const scheduleStudents = await this.db
        .select({
          seating_plan_id: seating_plan.id,
          student_id: students.id,
          firstname: students.firstname,
          lastname: students.lastname,
          student_number: students.student_id,
          section: students.section,
          course: students.course,
          seat_number: seating_plan.seat_number,
          monitor_status: seating_plan.monitor_status,
          mouse_status: seating_plan.mouse_status,
          keyboard_status: seating_plan.keyboard_status,
          cables_status: seating_plan.cables_status,
        })
        .from(seating_plan)
        .innerJoin(students, eq(seating_plan.student_id, students.id))
        .where(eq(seating_plan.schedule_id, scheduleId))
        .orderBy(seating_plan.seat_number)

      this.logger.info('Schedule students retrieved successfully', {
        scheduleId,
        studentsCount: scheduleStudents.length,
        timestamp: new Date().toISOString(),
      })

      return scheduleStudents
    }
    catch (error) {
      this.logger.error('Failed to retrieve schedule students', {
        error: (error as Error).message,
        scheduleId,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Adds students to a specific schedule
   * @param {string} scheduleId - The schedule ID
   * @param {object} data - The students data to add
   * @param {Array<{student_id: string, seat_number: string, monitor_status?: string, mouse_status?: string, keyboard_status?: string, cables_status?: string}>} data.students - Array of student information to add
   * @returns {Promise<any>} The result of the operation
   * @throws {Error} If the operation fails or schedule not found
   */
  async addStudentsToSchedule(scheduleId: string, data: { students: Array<{
    student_id: string
    seat_number: string
    monitor_status?: string
    mouse_status?: string
    keyboard_status?: string
    cables_status?: string
  }> }) {
    try {
      // Verify schedule exists and get laboratory_id
      const [scheduleData] = await this.db
        .select({
          id: schedule.id,
          laboratory_id: schedule.laboratory_id,
        })
        .from(schedule)
        .where(eq(schedule.id, scheduleId))
        .limit(1)

      if (!scheduleData) {
        throw new Error('Schedule not found')
      }

      // Verify all students exist
      const studentIds = data.students.map(s => s.student_id)
      const existingStudents = await this.db
        .select({ id: students.id })
        .from(students)
        .where(inArray(students.id, studentIds))

      if (existingStudents.length !== studentIds.length) {
        // Check which students don't exist
        const foundIds = existingStudents.map(s => s.id)
        const missingIds = studentIds.filter(id => !foundIds.includes(id))
        throw new Error(`Students not found: ${missingIds.join(', ')}`)
      }

      // Check if any students are already enrolled in this schedule
      const existingEnrollments = await this.db
        .select({ student_id: seating_plan.student_id })
        .from(seating_plan)
        .where(
          and(
            eq(seating_plan.schedule_id, scheduleId),
            inArray(seating_plan.student_id, studentIds),
          ),
        )

      const enrolledIds = existingEnrollments.map(e => e.student_id)
      const duplicates = studentIds.filter(id => enrolledIds.includes(id))
      if (duplicates.length > 0) {
        throw new Error(`Students already enrolled in this schedule: ${duplicates.join(', ')}`)
      }

      // Create seating plan entries for each student
      const seatingPlans = await this.db
        .insert(seating_plan)
        .values(
          data.students.map(student => ({
            laboratory_id: scheduleData.laboratory_id,
            schedule_id: scheduleId,
            student_id: student.student_id,
            seat_number: student.seat_number,
            monitor_status: student.monitor_status || 'Good condition',
            mouse_status: student.mouse_status || 'Good condition',
            keyboard_status: student.keyboard_status || 'Good condition',
            cables_status: student.cables_status || 'Good condition',
          })),
        )
        .returning()

      this.logger.info('Students added to schedule successfully', {
        scheduleId,
        addedCount: seatingPlans.length,
        timestamp: new Date().toISOString(),
      })

      return {
        added_count: seatingPlans.length,
        seating_plans: seatingPlans,
      }
    }
    catch (error) {
      this.logger.error('Failed to add students to schedule', {
        error: (error as Error).message,
        scheduleId,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Updates a student's seating information in a specific schedule
   * @param {string} scheduleId - The schedule ID
   * @param {string} studentId - The student ID
   * @param {object} data - The data to update
   * @param {string} data.seat_number - The seat number to assign
   * @param {string} data.monitor_status - The monitor condition status
   * @param {string} data.mouse_status - The mouse condition status
   * @param {string} data.keyboard_status - The keyboard condition status
   * @param {string} data.cables_status - The cables condition status
   * @returns {Promise<any>} The updated seating plan
   * @throws {Error} If the operation fails or not found
   */
  async updateStudentInSchedule(
    scheduleId: string,
    studentId: string,
    data: {
      seat_number?: string
      monitor_status?: string
      mouse_status?: string
      keyboard_status?: string
      cables_status?: string
    },
  ) {
    try {
      // Verify schedule exists
      const [scheduleExists] = await this.db
        .select({ id: schedule.id })
        .from(schedule)
        .where(eq(schedule.id, scheduleId))
        .limit(1)

      if (!scheduleExists) {
        throw new Error('Schedule not found')
      }

      // Find the seating plan entry
      const [seatingPlanEntry] = await this.db
        .select()
        .from(seating_plan)
        .where(
          and(
            eq(seating_plan.schedule_id, scheduleId),
            eq(seating_plan.student_id, studentId),
          ),
        )
        .limit(1)

      if (!seatingPlanEntry) {
        throw new Error('Student not found in this schedule')
      }

      // Update the seating plan
      const [updatedSeatingPlan] = await this.db
        .update(seating_plan)
        .set({
          ...(data.seat_number && { seat_number: data.seat_number }),
          ...(data.monitor_status && { monitor_status: data.monitor_status }),
          ...(data.mouse_status && { mouse_status: data.mouse_status }),
          ...(data.keyboard_status && { keyboard_status: data.keyboard_status }),
          ...(data.cables_status && { cables_status: data.cables_status }),
          updated_at: new Date(),
        })
        .where(eq(seating_plan.id, seatingPlanEntry.id))
        .returning()

      this.logger.info('Student updated in schedule successfully', {
        scheduleId,
        studentId,
        timestamp: new Date().toISOString(),
      })

      return updatedSeatingPlan
    }
    catch (error) {
      this.logger.error('Failed to update student in schedule', {
        error: (error as Error).message,
        scheduleId,
        studentId,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Removes a student from a specific schedule
   * @param {string} scheduleId - The schedule ID
   * @param {string} studentId - The student ID
   * @returns {Promise<void>}
   * @throws {Error} If the operation fails or not found
   */
  async removeStudentFromSchedule(scheduleId: string, studentId: string) {
    try {
      // Verify schedule exists
      const [scheduleExists] = await this.db
        .select({ id: schedule.id })
        .from(schedule)
        .where(eq(schedule.id, scheduleId))
        .limit(1)

      if (!scheduleExists) {
        throw new Error('Schedule not found')
      }

      // Find and delete the seating plan entry
      const [deletedEntry] = await this.db
        .delete(seating_plan)
        .where(
          and(
            eq(seating_plan.schedule_id, scheduleId),
            eq(seating_plan.student_id, studentId),
          ),
        )
        .returning()

      if (!deletedEntry) {
        throw new Error('Student not found in this schedule')
      }

      this.logger.info('Student removed from schedule successfully', {
        scheduleId,
        studentId,
        timestamp: new Date().toISOString(),
      })
    }
    catch (error) {
      this.logger.error('Failed to remove student from schedule', {
        error: (error as Error).message,
        scheduleId,
        studentId,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }
}
