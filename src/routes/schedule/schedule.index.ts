/**
 * @fileoverview Schedules router - connects routes with handlers
 */

import * as handlers from '@/handlers/schedule/schedule.handler'
import { createRouter } from '@/lib/create-app'
import { adminOnlyForNonGet, authMiddleware, requireRole } from '@/middleware/auth'
import * as routes from '@/routes/schedule/schedule.route'

/**
 * Schedules router group - Routes and their respective handlers are registered here
 * We then export this router to be registered in the root index.ts file
 */
const router = createRouter()

/**
 * @description Apply authentication to base and nested paths
 */
router.use('/schedules', authMiddleware)
router.use('/schedules/*', authMiddleware)

/**
 * @description Admin-only guard for non-GET methods
 */
router.use('/schedules', adminOnlyForNonGet)
router.use('/schedules/*', adminOnlyForNonGet)

/**
 * @description Allow read access for admin, teacher, technical on GET endpoints
 */
router.use('/schedules', requireRole(['admin', 'teacher', 'technical']))
router.use('/schedules/*', requireRole(['admin', 'teacher', 'technical']))

/**
 * @description Route registrations - connects each route with its respective handler
 */
router.openapi(routes.getScheduleRoute, handlers.GetScheduleHandler)
router.openapi(routes.listSchedulesRoute, handlers.ListSchedulesHandler)
router.openapi(routes.createScheduleRoute, handlers.CreateScheduleHandler)
router.openapi(routes.updateScheduleRoute, handlers.UpdateScheduleHandler)
router.openapi(routes.deleteScheduleRoute, handlers.DeleteScheduleHandler)

export default router
