import * as dashboardHandlers from '@/handlers/teachers/get-teacher-dashboard.handler'
import * as laboratoriesHandlers from '@/handlers/teachers/get-teacher-laboratories.handler'
import * as teachersHandlers from '@/handlers/teachers/get-teachers.handler'

import { createRouter } from '@/lib/create-app'
import { authMiddleware, requireRole } from '@/middleware/auth'
import { getTeacherDashboardRoute, getTeacherLaboratoriesRoute, getTeachersRoute } from '@/routes/teachers/teachers.routes'

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

export default router
