/**
 * @fileoverview User management router - connects routes with handlers
 */

import * as createHandlers from '@/handlers/users/create-user.handler'
import { GetUserHandler } from '@/handlers/users/get-user.handler'
import { ListUsersHandler } from '@/handlers/users/list-users.handler'
import * as updateHandlers from '@/handlers/users/update-user.handler'
import { createRouter } from '@/lib/create-app'
import * as routes from '@/routes/users/users.route'

/**
 * Users router group - Routes and their respective handlers are registered here
 * We then export this router to be registered in the root index.ts file
 */
const router = createRouter()
  .openapi(routes.createUserRoute, createHandlers.CreateUserHandler)
  .openapi(routes.updateUserRoute, updateHandlers.UpdateUserHandler)
  .openapi(routes.getUserRoute, GetUserHandler)
  .openapi(routes.listUsersRoute, ListUsersHandler)

export default router
