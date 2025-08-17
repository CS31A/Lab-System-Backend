import * as dashboardHandlers from '@/handlers/teachers/get-teacher-dashboard.handler'
import * as teachersHandlers from '@/handlers/teachers/get-teachers.handler'

import { createRouter } from '@/lib/create-app'
import { authMiddleware, requireRole } from '@/middleware/auth'
import { getTeacherDashboardRoute, getTeachersRoute } from '@/routes/teachers/teachers.routes'

const router = createRouter()
router.use('/teachers/dashboard', authMiddleware(), requireRole(['teacher', 'admin']))

router.openapi(getTeachersRoute, teachersHandlers.GetTeachersHandler)
router.openapi(getTeacherDashboardRoute, dashboardHandlers.GetTeacherDashboardHandler)

export default router
