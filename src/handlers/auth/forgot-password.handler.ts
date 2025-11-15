/**
 * @fileoverview Forgot Password Handler - Initiates password reset process
 */

import type { AppRouteHandler } from '@/lib/types/app-types'
import type { ForgotPasswordRoute } from '@/routes/auth/auth.routes'
import { maskEmail } from '@/lib/utils/email'
import * as httpStatusCodes from '@/openapi/http-status-codes'
import { PasswordResetService } from '@/services/PasswordResetService'

/**
 * Handler for initiating password reset requests
 *
 * This handler:
 * 1. Validates the email format (handled by Zod schema)
 * 2. Initiates the password reset process
 * 3. Always returns success to prevent user enumeration
 *
 * @param c - Hono context
 * @returns Promise resolving to success response
 */
export const ForgotPasswordHandler: AppRouteHandler<ForgotPasswordRoute> = async (c) => {
  const { email } = c.req.valid('json')

  try {
    const resetService = new PasswordResetService(c)
    await resetService.requestPasswordReset({ email })

    // Always return success to prevent user enumeration
    // Don't reveal whether the email exists or not
    return c.json(
      {
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
      },
      httpStatusCodes.OK,
    )
  }
  catch (error) {
    c.var.logger.error('Forgot password request failed', {
      email: maskEmail(email),
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    })
    // Still return success to prevent information leakage
    return c.json(
      {
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
      },
      httpStatusCodes.OK,
    )
  }
}
