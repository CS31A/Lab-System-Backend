/**
 * @fileoverview Laboratories router - connects routes with handlers
 */

import * as handlers from '@/handlers/laboratories/laboratories.handler'
import { createRouter } from '@/lib/create-app'
import { adminOnlyForNonGet, authMiddleware, requireRole } from '@/middleware/auth'
import * as routes from '@/routes/laboratories/laboratories.route'

/**
 * Laboratories router group - Routes and their respective handlers are registered here
 * We then export this router to be registered in the root index.ts file
 */
const router = createRouter()

/**
 * @description Apply authentication to all laboratory routes, including base and nested paths
 */
router.use('/laboratories', authMiddleware)
router.use('/laboratories/*', authMiddleware)

/**
 * @description Admin-only guard for non-GET methods (e.g., POST, PATCH, DELETE)
 */
router.use('/laboratories', adminOnlyForNonGet)
router.use('/laboratories/*', adminOnlyForNonGet)

/**
 * @description Keep specific admin-only GET endpoint(s)
 */
router.use('/laboratories/all', requireRole(['admin']))

/**
 * @description Allow read access to non-admin roles on GET endpoints (applies to base and nested paths)
 */
router.use('/laboratories', requireRole(['admin', 'teacher', 'technical']))
router.use('/laboratories/*', requireRole(['admin', 'teacher', 'technical']))

/**
 * @description Route registrations - connects each route with its respective handler
 */
// Route registrations
router.openapi(routes.createLaboratoryRoute, handlers.CreateLaboratoryHandler)
router.openapi(routes.getAllLaboratoriesRoute, handlers.GetAllLaboratoriesHandler)
router.openapi(routes.updateLaboratoryRoute, handlers.UpdateLaboratoryHandler)
router.openapi(routes.deleteLaboratoryRoute, handlers.DeleteLaboratoryHandler)
router.openapi(routes.getLaboratoryRoute, handlers.GetLaboratoryHandler)
router.openapi(routes.listLaboratoriesRoute, handlers.ListLaboratoriesHandler)

export default router
