/**
 * @fileoverview Get Me handler - returns minimal info from the verified JWT payload
 * Response follows { message, data } format.
 */

import * as httpStatusCodes from '@/openapi/http-status-codes'
import type { AppRouteHandler } from '@/lib/types/app-types'
import type { GetCurrentUserRoute } from '@/routes/auth/auth.routes'

export const GetCurrentUserHandler: AppRouteHandler<GetCurrentUserRoute> = async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const { sub, role } = payload

    return c.json(
      { 
        message: 'Successfully retrieved user information from token', 
        data: { sub, role } 
      }, 
      httpStatusCodes.OK)
  }
  catch (error) {
    const errMsg = (error as Error).message
    return c.json(
      { 
        message: 'Internal Server Error', 
        errors: errMsg 
      }, 
      httpStatusCodes.INTERNAL_SERVER_ERROR)
  }
}