/**
 * @fileoverview Students router - connects routes with handlers
 */

import * as handlers from '@/handlers/students/students.handler'
import { createRouter } from '@/lib/create-app'
import { adminOnlyForNonGet, authMiddleware, requireRole } from '@/middleware/auth'
import * as routes from '@/routes/students/students.route'

/**
 * Students router group - Routes and their respective handlers are registered here
 * We then export this router to be registered in the root index.ts file
 */
const router = createRouter()

/**
 * @description Apply authentication to base and nested paths
 */
router.use('/students', authMiddleware)
router.use('/students/*', authMiddleware)

/**
 * @description Admin-only guard for non-GET methods
 */
router.use('/students', adminOnlyForNonGet)  // Apply admin-only restriction for POST/PUT/DELETE methods
router.use('/students/*', adminOnlyForNonGet)

/**
 * @description Allow read access for admin, teacher, technical on GET endpoints
 */
// Note: The adminOnlyForNonGet middleware already handles role restrictions for non-GET methods
router.use('/students', requireRole(['admin', 'teacher', 'technical']))
router.use('/students/*', requireRole(['admin', 'teacher', 'technical']))

/**
 * @description Route registrations - connects each route with its respective handler
 */
// Route registrations
router.openapi(routes.createStudentRoute, handlers.CreateStudentHandler)
router.openapi(routes.getAllStudentsRoute, handlers.ListStudentsHandler)
router.openapi(routes.getAllStudentsNoPaginationRoute, handlers.GetAllStudentsHandler)
router.openapi(routes.getStudentRoute, handlers.GetStudentHandler)

export default router