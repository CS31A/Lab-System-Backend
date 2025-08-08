import type { Context } from 'hono'
import { getCookie, deleteCookie } from 'hono/cookie'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import type { AppBindings } from '@/lib/types/app-types'
import { AuthService } from '@/services/AuthService'

export const LogoutHandler = async (c: Context<AppBindings>) => {
    const refreshToken = getCookie(c, 'refreshToken')

    if (refreshToken) {
        try {
            const authService = new AuthService(c)
            await authService.logout(refreshToken)
        } catch (error) {

            console.error("Failed to invalidate refresh token:", error)
        }
    }

    deleteCookie(c, 'accessToken', {
        path: '/',
    })
    deleteCookie(c, 'refreshToken', {
        path: '/auth/refresh',
    })

    return c.json({ message: 'Logged out successfully' }, httpStatusCodes.OK)
}