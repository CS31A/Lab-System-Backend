/**
 * @fileoverview Logout handler - invalidates the current refresh session and clears auth cookies
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { LogoutRoute } from '@/routes/auth/auth.routes'
import { deleteCookie, getCookie } from 'hono/cookie'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { AuthService } from '@/services/AuthService'

/**
 * Handles user logout. It invalidates the refresh token on the server-side
 * and clears the access and refresh token cookies from the client's browser.
 *
 * @param c - The Hono context.
 * @returns A JSON response confirming successful logout.
 */
export const LogoutHandler: AppRouteHandler<LogoutRoute> = async (c) => {
  // Get the refresh token from the cookie
  const refreshToken = getCookie(c, 'refreshToken')

  if (refreshToken) {
    try {
      // Invalidate the refresh token session in the database
      const authService = new AuthService(c)
      await authService.invalidateRefreshSession(refreshToken)
    }
    catch (error) {
      // Log the error and continue with cookie deletion.
      // The logout process should be idempotent from the client's perspective,
      // ensuring the user is logged out even if server-side invalidation fails.
      const msg = (error as Error)?.message ?? String(error)
      c.var.logger.error('Failed to invalidate refresh token but proceeding with client-side logout', {
        error: msg,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Always clear client-side cookies to complete the logout process for the user.
  deleteCookie(c, 'accessToken', { path: '/' })
  deleteCookie(c, 'refreshToken', { path: '/auth/refresh' })

  c.var.logger.info('User logged out successfully', {
    timestamp: new Date().toISOString(),
  })

  return c.json({ message: 'Logout successful' }, httpStatusCodes.OK)
}
