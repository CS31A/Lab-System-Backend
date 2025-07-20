import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

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
