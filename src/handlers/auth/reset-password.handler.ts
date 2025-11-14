/**
 * @fileoverview Reset Password Handler - Completes password reset process
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { ResetPasswordRoute } from '@/routes/auth/auth.routes'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { PasswordResetService } from '@/services/PasswordResetService'

/**
 * Handler for completing password reset with token
 *
 * This handler:
 * 1. Validates the token and new password (handled by Zod schema)
 * 2. Resets the user's password
 * 3. Marks the token as used
 * 4. Returns success or appropriate error
 *
 * @param c - Hono context
 * @returns Promise resolving to success or error response
 */
export const ResetPasswordHandler: AppRouteHandler<ResetPasswordRoute> = async (c) => {
  const { token, newPassword } = c.req.valid('json')

  try {
    const resetService = new PasswordResetService(c)
    await resetService.resetPassword({ token, newPassword })

    c.var.logger.info('Password reset completed successfully', {
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      },
      httpStatusCodes.OK,
    )
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    c.var.logger.warn('Password reset failed', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })

    // Return specific error messages for better UX
    if (errorMessage.includes('Invalid') || errorMessage.includes('expired')) {
      return c.json(
        {
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.',
        },
        httpStatusCodes.BAD_REQUEST,
      )
    }

    if (errorMessage.includes('User account not found')) {
      return c.json(
        {
          success: false,
          message: 'User account not found or has been deactivated.',
        },
        httpStatusCodes.BAD_REQUEST,
      )
    }

    // Generic error for other cases
    return c.json(
      {
        success: false,
        message: 'Failed to reset password. Please try again or contact support.',
      },
      httpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }
}
