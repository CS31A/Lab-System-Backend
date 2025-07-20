import type { AppOpenAPI } from '@/lib/types/app-types'
import { Scalar } from '@scalar/hono-api-reference'
import packageJSON from '../../package.json'

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc('/docs', {
    openapi: '3.0.0',
    info: {
      version: packageJSON.version,
      title: 'Hono API',
    },
  })

  app.get('/reference', Scalar({
    url: '/docs',
    pageTitle: 'Hono API Documentation',
    layout: 'classic', // classic or modern
    defaultHttpClient: {
      targetKey: 'javascript',
      clientKey: 'fetch',
    },
    theme: 'kepler', // alternate, kepler, dark, purple, moon, solarized, bluePlanet, saturn, deepSpace, mars, none
    // check scalar's official documentation for more options : https://guides.scalar.com/scalar/scalar-api-references/integrations/hono
  }))
}
