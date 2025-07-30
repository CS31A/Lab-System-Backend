import * as handlers from '@/handlers/teachers/get-teachers.handler'
import { createRouter } from '@/lib/create-app'
import * as routes from '@/routes/teachers/teachers.routes'

const router = createRouter()
  .openapi(routes.getTeachersRoute, handlers.GetTeachersHandler)

export default router
