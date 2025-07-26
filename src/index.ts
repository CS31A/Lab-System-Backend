import type { AppOpenAPI } from './lib/types/app-types'
import createApp from '@/lib/create-app'
import configureOpenAPI from '@/lib/openapi-configuration'
import index from '@/routes/index'
// import items from '@/routes/items/items.index'

const app = createApp()

const routes = [index]

configureOpenAPI(app as AppOpenAPI)

routes.forEach((route) => {
  app.route('/', route)
})

export default app
