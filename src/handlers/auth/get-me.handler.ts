
import type { Context } from 'hono'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import type { AppBindings } from '@/lib/types/app-types'

export const GetMeHandler = async (c: Context<AppBindings>) => {

    const payload = c.get('jwtPayload')

    const { sub, role } = payload

    return c.json({ sub, role }, httpStatusCodes.OK)
}