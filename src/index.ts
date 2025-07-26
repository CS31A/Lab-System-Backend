import type { AppOpenAPI } from './lib/types/app-types'
import createApp from '@/lib/create-app'
import configureOpenAPI from '@/lib/openapi-configuration'
import index from '@/routes/index'
import users from '@/routes/users/users.index'

const app = createApp()

const routes = [index, users]

configureOpenAPI(app as AppOpenAPI)

routes.forEach((route) => 
  app.route('/', route)
)

export default app
