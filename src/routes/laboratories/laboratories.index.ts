/**
 * @fileoverview Laboratories router - connects routes with handlers
 */

import * as handlers from '@/handlers/laboratories/laboratories.handler'
import { createRouter } from '@/lib/create-app'
import { authMiddleware, requireRole } from '@/middleware/auth'
import * as routes from '@/routes/laboratories/laboratories.route'

/**
 * Laboratories router group - Routes and their respective handlers are registered here
 * We then export this router to be registered in the root index.ts file
 */
const router = createRouter()
router.use('/laboratories/*', authMiddleware)
router.use('/laboratories', requireRole(['admin']))

router.openapi(routes.createLaboratoryRoute, handlers.CreateLaboratoryHandler)
router.openapi(routes.getAllLaboratoriesRoute, handlers.GetAllLaboratoriesHandler)
router.openapi(routes.updateLaboratoryRoute, handlers.UpdateLaboratoryHandler)
router.openapi(routes.deleteLaboratoryRoute, handlers.DeleteLaboratoryHandler)

router.use('/laboratories', requireRole(['admin', 'teacher', 'technical']))

router.openapi(routes.getLaboratoryRoute, handlers.GetLaboratoryHandler)
router.openapi(routes.listLaboratoriesRoute, handlers.ListLaboratoriesHandler)

export default router
