/**
 * @fileoverview Subjects router - connects routes with handlers
 */

import * as handlers from '@/handlers/subjects/subjects.handler'
import { createRouter } from '@/lib/create-app'
import { authMiddleware, requireRole } from '@/middleware/auth'
import * as routes from '@/routes/subjects/subjects.route'

/**
 * Subjects router group - Routes and their respective handlers are registered here
 * We then export this router to be registered in the root index.ts file
 */
const router = createRouter()
router.use('/subjects/*', authMiddleware)
router.use('/subjects', requireRole(['admin']))

router.openapi(routes.createSubjectRoute, handlers.CreateSubjectHandler)
router.openapi(routes.getAllSubjectsRoute, handlers.GetAllSubjectsHandler)
router.openapi(routes.updateSubjectRoute, handlers.UpdateSubjectHandler)
router.openapi(routes.deleteSubjectRoute, handlers.DeleteSubjectHandler)

router.use('/subjects', requireRole(['admin', 'teacher', 'technical']))

router.openapi(routes.getSubjectRoute, handlers.GetSubjectHandler)
router.openapi(routes.listSubjectsRoute, handlers.ListSubjectsHandler)

export default router
