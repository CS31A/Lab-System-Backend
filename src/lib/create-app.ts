import type { AppBindings, AppOpenAPI } from '@/lib/types/app-types'
import { OpenAPIHono } from '@hono/zod-openapi'
import logger from '@/middleware/pino-logger'
import notFound from '@/middleware/utils/not-found'
import onError from '@/middleware/utils/on-error'
// import serveEmojiFavicon from '@/middleware/utils/serve-emoji-favicon'
import defaultHook from '@/openapi/default-hook'

export default function createApp() {
  const app = createRouter()
    .use(logger())
    // .use(serveEmojiFavicon('🔥'))
  app.notFound(notFound)
  app.onError(onError)

  return app
}

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  })
}

export function createTestApp(router: AppOpenAPI) {
  const testApp = createRouter()
  testApp.route('/', router)

  return testApp
}
