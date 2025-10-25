import type { NotFoundHandler } from 'hono'

import { NOT_FOUND } from '@/openapi/http-status-codes'
import { NOT_FOUND as NOT_FOUND_MESSAGE } from '@/openapi/http-status-phrases'

/**
 * Handles 404 Not Found responses for the application.
 *
 * This function creates a custom not-found handler that returns a JSON response
 * with a descriptive message including the requested path, using the standard
 * 404 status code.
 *
 * @param c - The Hono context object
 * @returns A JSON response with the not found message and 404 status code
 *
 * @example
 * ```typescript
 * import createApp from '@/lib/create-app'
 * import notFound from '@/middleware/utils/not-found'
 *
 * const app = createApp()
 * app.notFound(notFound) // Set custom 404 handler
 *
 * // Any unmatched route will return:
 * // { message: "Not Found - /invalid/path" } with 404 status
 * ```
 */
const notFound: NotFoundHandler = (c) => {
  return c.json({
    message: `${NOT_FOUND_MESSAGE} - ${c.req.path}`,
  }, NOT_FOUND)
}

export default notFound
