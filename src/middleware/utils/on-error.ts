import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

/**
 * Global error handler for the application.
 *
 * This function handles errors in the Hono application, distinguishing between
 * HTTP exceptions and other errors. For HTTP exceptions, it returns the built-in
 * response. For other errors, it returns a generic 500 response with error details.
 * In production, stack traces are omitted from the response.
 *
 * @param err - The error object to handle
 * @param c - The Hono context object
 * @returns A JSON response with error details and appropriate status code
 *
 * @example
 * ```typescript
 * import createApp from '@/lib/create-app'
 * import onError from '@/middleware/utils/on-error'
 *
 * const app = createApp()
 * app.onError(onError) // Set global error handler
 *
 * // In development, errors return:
 * // { message: 'Internal Server Error', error: '...', stack: '...' }
 * // In production, errors return:
 * // { message: 'Internal Server Error', error: '...' }
 * ```
 */
const onError: ErrorHandler = (err, c) => {
  // Check if the error is an instance of HTTPException
  if (err instanceof HTTPException) {
    // Use the built-in getResponse() method to generate a Response object
    // This automatically handles status codes and headers.
    return err.getResponse()
  }

  // For all other errors, return a generic 500 response
  // You can customize this as needed
  // eslint-disable-next-line node/prefer-global/process
  const env = c.env?.NODE_ENV || process.env?.NODE_ENV
  return c.json(
    {
      message: 'Internal Server Error',
      error: err.message,
      stack: env === 'production' ? undefined : err.stack,
    },
    500,
  )
}

export default onError
