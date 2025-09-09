/**
 * @fileoverview Subjects router - connects routes with handlers
 */

import * as handlers from '@/handlers/subjects/subjects.handler'
import { createRouter } from '@/lib/create-app'
import { adminOnlyForNonGet, authMiddleware, requireRole } from '@/middleware/auth'
import * as routes from '@/routes/subjects/subjects.route'

/**
 * Subjects router group - Routes and their respective handlers are registered here
 * We then export this router to be registered in the root index.ts file
 */
const router = createRouter()

// Apply authentication to base and nested paths
router.use('/subjects', authMiddleware)
router.use('/subjects/*', authMiddleware)

// Admin-only guard for non-GET methods
router.use('/subjects', adminOnlyForNonGet)
router.use('/subjects/*', adminOnlyForNonGet)

// Allow read access for admin, teacher, technical on GET endpoints
router.use('/subjects', requireRole(['admin', 'teacher', 'technical']))
router.use('/subjects/*', requireRole(['admin', 'teacher', 'technical']))

// Route registrations
router.openapi(routes.getSubjectRoute, handlers.GetSubjectHandler)
router.openapi(routes.listSubjectsRoute, handlers.ListSubjectsHandler)
router.openapi(routes.createSubjectRoute, handlers.CreateSubjectHandler)
router.openapi(routes.updateSubjectRoute, handlers.UpdateSubjectHandler)
router.openapi(routes.deleteSubjectRoute, handlers.DeleteSubjectHandler)

export default router
