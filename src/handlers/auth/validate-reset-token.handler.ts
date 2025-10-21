/**
 * @fileoverview Validate Reset Token Handler - Validates password reset tokens
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { ValidateResetTokenRoute } from '@/routes/auth/auth.routes'
import { PasswordResetService } from '@/services/PasswordResetService'
import * as httpStatusCodes from '@/openapi/http-status-codes'

/**
 * Handler for validating password reset tokens
 * 
 * This handler:
 * 1. Validates the token format and expiry
 * 2. Returns token validity and user information
 * 3. Does not consume the token (can be called multiple times)
 * 
 * @param c - Hono context
 * @returns Promise resolving to validation result
 */
export const ValidateResetTokenHandler: AppRouteHandler<ValidateResetTokenRoute> = async (c) => {
    const token = c.req.query('token')

    if (!token) {
        return c.json(
            {
                valid: false,
                message: 'Reset token is required',
            },
            httpStatusCodes.BAD_REQUEST,
        )
    }

    try {
        const resetService = new PasswordResetService(c)
        const validation = await resetService.validateResetToken(token)

        if (validation.valid && validation.user) {
            return c.json(
                {
                    valid: true,
                    message: 'Token is valid',
                    user: {
                        username: validation.user.username,
                        email: validation.user.email,
                    },
                    expiresAt: validation.expiresAt,
                },
                httpStatusCodes.OK,
            )
        } else {
            return c.json(
                {
                    valid: false,
                    message: 'Invalid or expired reset token',
                },
                httpStatusCodes.BAD_REQUEST,
            )
        }
    } catch (error) {
        c.var.logger.error('Token validation failed', {
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
        })

        return c.json(
            {
                valid: false,
                message: 'Failed to validate token',
            },
            httpStatusCodes.INTERNAL_SERVER_ERROR,
        )
    }
}