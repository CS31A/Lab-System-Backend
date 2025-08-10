/**
 * @fileoverview Get Me handler - returns minimal info from the verified JWT payload
 * Response follows { message, data } format.
 */

import * as httpStatusCodes from '@/openapi/http-status-codes'
import type { AppRouteHandler } from '@/lib/types/app-types'

export const GetCurrentUserHandler: AppRouteHandler<typeof import('@/routes/auth/auth.routes').getCurrentUserRoute> = async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const { sub, role } = payload

    return c.json({ message: 'User info retrieved', data: { sub, role } }, httpStatusCodes.OK)
  }
  catch (error) {
    const errMsg = (error as Error).message
    return c.json({ message: 'Internal Server Error', errors: errMsg }, httpStatusCodes.INTERNAL_SERVER_ERROR)
  }
}