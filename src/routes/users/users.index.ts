/**
 * @fileoverview User management router - connects routes with handlers
 */

import * as handlers from '@/handlers/users/create-user.handler'
import { createRouter } from '@/lib/create-app'
import * as routes from '@/routes/users/users.route'

/**
 * Users router group - Routes and their respective handlers are registered here
 * We then export this router to be registered in the root index.ts file
 */
const router = createRouter()
  .openapi(routes.createUserRoute, handlers.CreateUserHandler)

export default router
