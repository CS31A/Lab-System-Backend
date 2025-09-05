/**
 * @fileoverview User management router - connects routes with handlers
 */

import * as createHandlers from '@/handlers/users/create-user.handler'
import { GetAllUsersHandler } from '@/handlers/users/get-all-users.handler'
import { GetUserHandler } from '@/handlers/users/get-user.handler'
import { ListUsersHandler } from '@/handlers/users/list-users.handler'
import { RestoreUserHandler } from '@/handlers/users/restore-user.handler'
import { SoftDeleteUserHandler } from '@/handlers/users/soft-delete-user.handler'
import * as updateHandlers from '@/handlers/users/update-user.handler'
import { createRouter } from '@/lib/create-app'
import { authMiddleware, requireRole } from '@/middleware/auth'
import * as routes from '@/routes/users/users.route'

/**
 * Users router group - Routes and their respective handlers are registered here
 * We then export this router to be registered in the root index.ts file
 */
const router = createRouter()
router.use('/users', authMiddleware)
// Admin only routes
router.use('/users', requireRole(['admin']))
router.openapi(routes.createUserRoute, createHandlers.CreateUserHandler)
router.openapi(routes.updateUserRoute, updateHandlers.UpdateUserHandler)
router.openapi(routes.softDeleteUserRoute, SoftDeleteUserHandler)
router.openapi(routes.restoreUserRoute, RestoreUserHandler)
// Admin, Teacher, Technical routes
router.use('/users', requireRole(['admin', 'teacher', 'technical']))
router.openapi(routes.getUserRoute, GetUserHandler)
router.openapi(routes.getAllUsersRoute, GetAllUsersHandler)
router.openapi(routes.listUsersRoute, ListUsersHandler)

export default router
