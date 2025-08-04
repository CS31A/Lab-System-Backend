import type { Context } from 'hono'
import type { AppBindings } from '@/lib/types/app-types'

export const GetMeHandler = async (c: Context<AppBindings>) =>{
    const payload = c.get('jwtPayload')
    return c.json(payload, 200)
}