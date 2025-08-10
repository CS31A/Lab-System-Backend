import * as dashboardHandlers from '@/handlers/teachers/get-teacher-dashboard.handler'
import * as teachersHandlers from '@/handlers/teachers/get-teachers.handler'

import { createRouter } from '@/lib/create-app'
import { getTeacherDashboardRoute, getTeachersRoute } from '@/routes/teachers/teachers.routes'

const router = createRouter()
  .openapi(getTeachersRoute, teachersHandlers.GetTeachersHandler)
  .openapi(getTeacherDashboardRoute, dashboardHandlers.GetTeacherDashboardHandler)

export default router
