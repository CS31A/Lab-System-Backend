import * as dashboardHandlers from '@/handlers/technical/get-technical-staff-dashboard.handler'
import * as laboratoriesHandlers from '@/handlers/technical/get-technical-staff-laboratories.handler'
import * as technicalStaffHandlers from '@/handlers/technical/get-technical-staff.handler'

import { createRouter } from '@/lib/create-app'
import { authMiddleware, requireRole } from '@/middleware/auth'
import { getTechnicalStaffDashboardRoute, getTechnicalStaffLaboratoriesRoute, getTechnicalStaffRoute } from '@/routes/technical/technical.route'

const router = createRouter()

/**
 * @description Apply authentication and role guard to base and nested paths
 * Only technical staff and admins can access these endpoints
 */
router.use('/technical-staff', authMiddleware, requireRole(['technical_staff', 'admin']))
router.use('/technical-staff/*', authMiddleware, requireRole(['technical_staff', 'admin']))

/**
 * @description Route registrations - connects each route with its respective handler
 */
router.openapi(getTechnicalStaffRoute, technicalStaffHandlers.GetTechnicalStaffHandler)
router.openapi(getTechnicalStaffLaboratoriesRoute, laboratoriesHandlers.GetTechnicalStaffLaboratoriesHandler)
router.openapi(getTechnicalStaffDashboardRoute, dashboardHandlers.GetTechnicalStaffDashboardHandler)

export default router
