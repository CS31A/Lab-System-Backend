/**
 * @fileoverview TechnicalStaffService - Core business logic for technical staff management
 * Handles technical staff data retrieval, laboratory maintenance status, and dashboard operations
 */

import type { Context } from 'hono'
import { and, count, eq, gte, isNull, lte, sql } from 'drizzle-orm'
import { createDb } from '@/db'
import { lab_activity_log, laboratory, schedule, seating_plan, subjects, teachers, technical_staff } from '@/db/schema'

export interface ListTechnicalStaffParams {
  page: number
  limit: number
}

export interface ListTechnicalStaffResult {
  technicalStaff: Array<typeof technical_staff.$inferSelect>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface TechnicalStaffDashboardParams {
  technicalStaffId: string
}

export interface MaintenanceTask {
  laboratory_id: string
  laboratory_name: string
  issue_count: number
  priority: 'low' | 'medium' | 'high'
}

export interface RecentActivity {
  id: string
  laboratory_name: string
  activity_type: string
  description: string
  timestamp: string
}

export interface TechnicalStaffDashboardResult {
  totalLaboratories: number
  totalComputers: number
  functionalComputers: number
  computersNeedingMaintenance: number
  laboratoriesUnderMaintenance: number
  recentActivities: RecentActivity[]
  maintenanceTasks: MaintenanceTask[]
}

export class TechnicalStaffService {
  private db: ReturnType<typeof createDb>
  private logger: any

  constructor(c: Context) {
    this.db = createDb(c)
    this.logger = c.var.logger
  }

  /**
   * Lists technical staff with pagination
   * Retrieves paginated list of technical staff from the database with metadata
   * @param {ListTechnicalStaffParams} params - The pagination parameters
   * @returns {Promise<ListTechnicalStaffResult>} The list of technical staff with pagination metadata
   * @throws {Error} If the retrieval fails
   */
  async listTechnicalStaff(params: ListTechnicalStaffParams): Promise<ListTechnicalStaffResult> {
    const { page, limit } = params
    const offset = (page - 1) * limit

    try {
      const [totalResult, technicalStaffData] = await Promise.all([
        this.db.select({ count: count() })
          .from(technical_staff),
        this.db
          .select()
          .from(technical_staff)
          .limit(limit)
          .offset(offset)
          .orderBy(technical_staff.created_at),
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

      this.logger.info('Technical staff list retrieved successfully', {
        page,
        limit,
        total,
        totalPages,
        returned_count: technicalStaffData.length,
        timestamp: new Date().toISOString(),
      })

      return {
        technicalStaff: technicalStaffData,
        pagination,
      }
    }
    catch (error) {
      this.logger.error('Failed to retrieve technical staff list', {
        error: (error as Error).message,
        page,
        limit,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves all technical staff without pagination
   * Useful for administrative operations or exports
   * @returns {Promise<Array<typeof technical_staff.$inferSelect>>} All technical staff records
   * @throws {Error} If the retrieval fails
   */
  async getAllTechnicalStaff(): Promise<Array<typeof technical_staff.$inferSelect>> {
    try {
      const allTechnicalStaff = await this.db
        .select()
        .from(technical_staff)
        .orderBy(technical_staff.created_at)

      this.logger.info('All technical staff retrieved successfully', {
        count: allTechnicalStaff.length,
        timestamp: new Date().toISOString(),
      })

      return allTechnicalStaff
    }
    catch (error) {
      this.logger.error('Failed to retrieve all technical staff', {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves all laboratories with their current status and maintenance information
   * Determines if a lab is available, occupied, or under maintenance
   * Includes computer equipment status for technical staff
   * @returns {Promise<any[]>} The list of laboratories with their current status and maintenance info
   * @throws {Error} If the retrieval fails
   */
  async getLaboratoriesWithMaintenanceStatus() {
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

      // Get equipment status for each laboratory
      const equipmentStatusPromises = laboratoriesWithSchedules.map(async (lab) => {
        const seatingPlans = await this.db
          .select({
            id: seating_plan.id,
            monitor_status: seating_plan.monitor_status,
            keyboard_status: seating_plan.keyboard_status,
            mouse_status: seating_plan.mouse_status,
            cables_status: seating_plan.cables_status,
          })
          .from(seating_plan)
          .where(eq(seating_plan.laboratory_id, lab.id))

        const totalComputers = seatingPlans.length
        let functionalComputers = 0
        let maintenanceNeeded = 0

        seatingPlans.forEach((seat) => {
          // Check if all components are in good condition
          const isFunctional =
            seat.monitor_status === 'Good condition' &&
            seat.keyboard_status === 'Good condition' &&
            seat.mouse_status === 'Good condition' &&
            seat.cables_status === 'Good condition'

          if (isFunctional) {
            functionalComputers++
          } else {
            maintenanceNeeded++
          }
        })

        return {
          labId: lab.id,
          totalComputers,
          functionalComputers,
          maintenanceNeeded,
        }
      })

      const equipmentStatuses = await Promise.all(equipmentStatusPromises)

      // Transform the data to include current status and equipment info
      const laboratoriesWithMaintenance = laboratoriesWithSchedules.map((lab) => {
        let vacancyStatus: 'available' | 'occupied' | 'maintenance'
        let currentSchedule = null

        // Find equipment status for this lab
        const equipmentStatus = equipmentStatuses.find(status => status.labId === lab.id)

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
          total_computers: equipmentStatus?.totalComputers || 0,
          functional_computers: equipmentStatus?.functionalComputers || 0,
          maintenance_needed: equipmentStatus?.maintenanceNeeded || 0,
          created_at: lab.created_at.toISOString(),
          updated_at: lab.updated_at.toISOString(),
        }
      })

      this.logger.info('Laboratories with maintenance status retrieved successfully', {
        totalLaboratories: laboratoriesWithMaintenance.length,
        available: laboratoriesWithMaintenance.filter(lab => lab.vacancy_status === 'available').length,
        occupied: laboratoriesWithMaintenance.filter(lab => lab.vacancy_status === 'occupied').length,
        maintenance: laboratoriesWithMaintenance.filter(lab => lab.vacancy_status === 'maintenance').length,
        timestamp: new Date().toISOString(),
      })

      return laboratoriesWithMaintenance
    }
    catch (error) {
      this.logger.error('Failed to retrieve laboratories with maintenance status', {
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Retrieves technical staff dashboard data including maintenance statistics
   * Returns comprehensive information about laboratory and equipment status
   * @param {TechnicalStaffDashboardParams} params - The parameters for retrieving dashboard data
   * @returns {Promise<TechnicalStaffDashboardResult>} The technical staff dashboard data
   * @throws {Error} If the retrieval fails
   */
  async getTechnicalStaffDashboard(params: TechnicalStaffDashboardParams): Promise<TechnicalStaffDashboardResult> {
    const { technicalStaffId } = params

    try {
      // Validate technical staff exists
      const technicalStaffExists = await this.db
        .select({ id: technical_staff.id })
        .from(technical_staff)
        .where(eq(technical_staff.id, technicalStaffId))
        .limit(1)

      if (!technicalStaffExists.length) {
        throw new Error(`Technical staff member does not exist`)
      }

      // Get all laboratories
      const laboratories = await this.db
        .select()
        .from(laboratory)

      const totalLaboratories = laboratories.length
      const laboratoriesUnderMaintenance = laboratories.filter(lab => !lab.status).length

      // Get equipment status across all laboratories
      const allSeatingPlans = await this.db
        .select({
          id: seating_plan.id,
          laboratory_id: seating_plan.laboratory_id,
          monitor_status: seating_plan.monitor_status,
          keyboard_status: seating_plan.keyboard_status,
          mouse_status: seating_plan.mouse_status,
          cables_status: seating_plan.cables_status,
        })
        .from(seating_plan)

      const totalComputers = allSeatingPlans.length
      let functionalComputers = 0
      let computersNeedingMaintenance = 0

      allSeatingPlans.forEach((seat) => {
        const isFunctional =
          seat.monitor_status === 'Good condition' &&
          seat.keyboard_status === 'Good condition' &&
          seat.mouse_status === 'Good condition' &&
          seat.cables_status === 'Good condition'

        if (isFunctional) {
          functionalComputers++
        } else {
          computersNeedingMaintenance++
        }
      })

      // Calculate maintenance tasks by laboratory
      const maintenanceTasks: MaintenanceTask[] = []

      for (const lab of laboratories) {
        const labSeatingPlans = allSeatingPlans.filter(seat => seat.laboratory_id === lab.id)
        const issueCount = labSeatingPlans.filter((seat) => {
          return !(
            seat.monitor_status === 'Good condition' &&
            seat.keyboard_status === 'Good condition' &&
            seat.mouse_status === 'Good condition' &&
            seat.cables_status === 'Good condition'
          )
        }).length

        if (issueCount > 0) {
          let priority: 'low' | 'medium' | 'high'
          const issuePercentage = (issueCount / labSeatingPlans.length) * 100

          if (issuePercentage >= 50) {
            priority = 'high'
          } else if (issuePercentage >= 25) {
            priority = 'medium'
          } else {
            priority = 'low'
          }

          maintenanceTasks.push({
            laboratory_id: lab.id,
            laboratory_name: lab.name,
            issue_count: issueCount,
            priority,
          })
        }
      }

      // Sort maintenance tasks by priority (high > medium > low) and then by issue count
      maintenanceTasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return b.issue_count - a.issue_count
      })

      // Get recent activities (last 10 lab activities)
      const recentActivityLogs = await this.db
        .select({
          id: lab_activity_log.id,
          laboratory_id: lab_activity_log.laboratory_id,
          laboratory_name: laboratory.name,
          time_in: lab_activity_log.time_in,
          time_out: lab_activity_log.time_out,
          status: lab_activity_log.status,
        })
        .from(lab_activity_log)
        .innerJoin(laboratory, eq(lab_activity_log.laboratory_id, laboratory.id))
        .orderBy(sql`${lab_activity_log.time_in} DESC`)
        .limit(10)

      const recentActivities: RecentActivity[] = recentActivityLogs.map((log) => ({
        id: log.id,
        laboratory_name: log.laboratory_name,
        activity_type: log.time_out ? 'Session Ended' : 'Session Started',
        description: log.time_out
          ? `Laboratory session ended at ${log.time_out.toLocaleString()}`
          : `Laboratory session started at ${log.time_in?.toLocaleString() || 'N/A'}`,
        timestamp: (log.time_out || log.time_in)?.toISOString() || new Date().toISOString(),
      }))

      const result: TechnicalStaffDashboardResult = {
        totalLaboratories,
        totalComputers,
        functionalComputers,
        computersNeedingMaintenance,
        laboratoriesUnderMaintenance,
        recentActivities,
        maintenanceTasks,
      }

      this.logger.info('Technical staff dashboard data retrieved successfully', {
        technicalStaffId,
        totalLaboratories,
        totalComputers,
        functionalComputers,
        computersNeedingMaintenance,
        maintenanceTasksCount: maintenanceTasks.length,
        timestamp: new Date().toISOString(),
      })

      return result
    }
    catch (error) {
      this.logger.error('Failed to retrieve technical staff dashboard data', {
        error: (error as Error).message,
        technicalStaffId,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }
}
