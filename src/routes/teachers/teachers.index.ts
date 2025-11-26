import * as addScheduleStudentsHandlers from '@/handlers/teachers/add-schedule-students.handler'
import * as labAvailabilityHandlers from '@/handlers/teachers/get-lab-availability.handler'
import * as labScheduleHandlers from '@/handlers/teachers/get-lab-schedule.handler'
import * as scheduleStudentsHandlers from '@/handlers/teachers/get-schedule-students.handler'
import * as dashboardHandlers from '@/handlers/teachers/get-teacher-dashboard.handler'
import * as laboratoriesHandlers from '@/handlers/teachers/get-teacher-laboratories.handler'
import * as teachersHandlers from '@/handlers/teachers/get-teachers.handler'
import * as removeScheduleStudentHandlers from '@/handlers/teachers/remove-schedule-student.handler'
import * as updateScheduleStudentHandlers from '@/handlers/teachers/update-schedule-student.handler'

import { createRouter } from '@/lib/create-app'
import { authMiddleware, requireRole } from '@/middleware/auth'
import {
  addScheduleStudentsRoute,
  getLabAvailabilityRoute,
  getLabScheduleRoute,
  getScheduleStudentsRoute,
  getTeacherDashboardRoute,
  getTeacherLaboratoriesRoute,
  getTeachersRoute,
  removeScheduleStudentRoute,
  updateScheduleStudentRoute,
} from '@/routes/teachers/teachers.routes'

const router = createRouter()

/**
 * @description Apply authentication and role guard to base and nested paths
 */
router.use('/teachers', authMiddleware, requireRole(['teacher', 'admin']))
router.use('/teachers/*', authMiddleware, requireRole(['teacher', 'admin']))

/**
 * @description Route registrations - connects each route with its respective handler
 */
router.openapi(getTeachersRoute, teachersHandlers.GetTeachersHandler)
router.openapi(getTeacherDashboardRoute, dashboardHandlers.GetTeacherDashboardHandler)
router.openapi(getTeacherLaboratoriesRoute, laboratoriesHandlers.GetTeacherLaboratoriesHandler)
router.openapi(getLabScheduleRoute, labScheduleHandlers.GetLabScheduleHandler)
router.openapi(getLabAvailabilityRoute, labAvailabilityHandlers.GetLabAvailabilityHandler)

// Schedule student management routes
router.openapi(getScheduleStudentsRoute, scheduleStudentsHandlers.GetScheduleStudentsHandler)
router.openapi(addScheduleStudentsRoute, addScheduleStudentsHandlers.AddScheduleStudentsHandler)
router.openapi(updateScheduleStudentRoute, updateScheduleStudentHandlers.UpdateScheduleStudentHandler)
router.openapi(removeScheduleStudentRoute, removeScheduleStudentHandlers.RemoveScheduleStudentHandler)

export default router
