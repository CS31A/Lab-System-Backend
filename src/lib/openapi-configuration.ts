/**
 * @fileoverview OpenAPI configuration module for Lab System Backend API.
 * Sets up OpenAPI documentation and Scalar API reference.
 */
import type { AppOpenAPI } from '@/lib/types/app-types'
import { Scalar } from '@scalar/hono-api-reference'
import packageJSON from '../../package.json'

/**
 * Configures OpenAPI documentation for the application.
 * Sets up OpenAPI spec at /docs endpoint and Scalar API reference at /reference.
 * @param {AppOpenAPI} app - The Hono application instance with OpenAPI support
 * @returns {void}
 */
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
      targetKey: 'js',
      clientKey: 'fetch',
    },
    theme: 'kepler', // alternate, kepler, dark, purple, moon, solarized, bluePlanet, saturn, deepSpace, mars, none
    // check scalar's official documentation for more options : https://guides.scalar.com/scalar/scalar-api-references/integrations/hono
  }))
}
