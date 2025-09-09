import * as dashboardHandlers from '@/handlers/teachers/get-teacher-dashboard.handler'
import * as teachersHandlers from '@/handlers/teachers/get-teachers.handler'

import { createRouter } from '@/lib/create-app'
import { authMiddleware, requireRole } from '@/middleware/auth'
import { getTeacherDashboardRoute, getTeachersRoute } from '@/routes/teachers/teachers.routes'

const router = createRouter()

// Apply authentication and role guard to base and nested paths
router.use('/teachers', authMiddleware, requireRole(['teacher', 'admin']))
router.use('/teachers/*', authMiddleware, requireRole(['teacher', 'admin']))

router.openapi(getTeachersRoute, teachersHandlers.GetTeachersHandler)
router.openapi(getTeacherDashboardRoute, dashboardHandlers.GetTeacherDashboardHandler)

export default router
