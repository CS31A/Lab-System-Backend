import * as handlers from '@/handlers/users/create-user.handler'
import { createRouter } from '@/lib/create-app'
import * as routes from '@/routes/users/users.route'

const router = createRouter()
    .openapi(routes.createUserRoute, handlers.CreateUserHandler)

export default router