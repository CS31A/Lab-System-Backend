/**
 * @fileoverview User management router - connects routes with handlers
 */

import * as createHandlers from '@/handlers/users/create-user.handler'
import { GetAllUsersHandler } from '@/handlers/users/get-all-users.handler'
import { GetUserHandler } from '@/handlers/users/get-user.handler'
import { HardDeleteUserHandler } from '@/handlers/users/hard-delete-user.handler'
import { ListUsersHandler } from '@/handlers/users/list-users.handler'
import { RestoreUserHandler } from '@/handlers/users/restore-user.handler'
import { SoftDeleteUserHandler } from '@/handlers/users/soft-delete-user.handler'
import * as updateHandlers from '@/handlers/users/update-user.handler'
import { createRouter } from '@/lib/create-app'
import { adminOnlyForNonGet, adminOnlyUsersListGet, authMiddleware, requireRole } from '@/middleware/auth'
import * as routes from '@/routes/users/users.route'

/**
 * Users router group - Routes and their respective handlers are registered here
 * We then export this router to be registered in the root index.ts file
 */
const router = createRouter()

// Apply authentication to base and nested paths
router.use('/users', authMiddleware)
router.use('/users/*', authMiddleware)

// Admin-only guard for non-GET methods
router.use('/users', adminOnlyForNonGet)
router.use('/users/*', adminOnlyForNonGet)

// Keep specific admin-only GET endpoint(s)
router.use('/users/all', requireRole(['admin']))

// Exact-path admin-only guard for GET /users that does not affect nested paths
router.use('/users', adminOnlyUsersListGet)

// - Single user and other nested GETs: admin, teacher, technical (GET only)
router.use('/users/*', requireRole(['admin', 'teacher', 'technical']))

// Route registrations
router.openapi(routes.createUserRoute, createHandlers.CreateUserHandler)
router.openapi(routes.updateUserRoute, updateHandlers.UpdateUserHandler)
router.openapi(routes.getAllUsersRoute, GetAllUsersHandler)
router.openapi(routes.softDeleteUserRoute, SoftDeleteUserHandler)
router.openapi(routes.restoreUserRoute, RestoreUserHandler)
router.openapi(routes.hardDeleteUserRoute, HardDeleteUserHandler)
router.openapi(routes.getUserRoute, GetUserHandler)
router.openapi(routes.listUsersRoute, ListUsersHandler)

export default router
