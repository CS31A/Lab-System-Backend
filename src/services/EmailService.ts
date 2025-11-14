/**
 * @fileoverview EmailService - Handles email sending for password reset and other notifications
 * Uses SendGrid for email delivery
 */

import type { Context } from 'hono'
import type { AppBindings } from '@/lib/types/app-types'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface PasswordResetEmailData {
  username: string
  resetUrl: string
  expiryHours: number
}

/**
 * A simple helper to escape HTML characters and prevent XSS.
 * @param str The string to escape.
 * @returns The escaped string.
 */
function escapeHTML(str: string): string {
  return str.replace(
    /[&<>"']/g,
    match =>
    ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;',
    }[match]!),
  )
}

/**
 * EmailService - Handles email sending functionality
 *
 * Uses SendGrid for email delivery with template support
 *
 * @example
 * ```typescript
 * const emailService = new EmailService(context)
 * await emailService.sendPasswordResetEmail('user@example.com', {
 * username: 'john_doe',
 * resetUrl: '[https://app.com/reset-password?token=abc123](https://app.com/reset-password?token=abc123)',
 * expiryHours: 1
 * })
 * ```
 */
export class EmailService {
  private c: Context<AppBindings>
  private logger: any

  constructor(c: Context<AppBindings>) {
    this.c = c
    this.logger = c.var.logger
  }

  private maskEmail(email: string): string {
    if (!email.includes('@')) {
      // Not a valid email format, return a generic masked string
      return '***'
    }
    const [localPart, domain] = email.split('@')
    if (!localPart || !domain) {
      return '***'
    }
    // Always show exactly 2 characters (or pad if shorter)
    const prefix = localPart.length >= 2 ? localPart.substring(0, 2) : localPart.padEnd(2, '*')
    return `${prefix}***@${domain}`
  }

  /**
   * Sends a password reset email to the user using SendGrid template or fallback to inline HTML
   *
   * @param email - Recipient email address
   * @param data - Password reset email data
   * @returns Promise that resolves when email is sent
   * @throws {Error} When email sending fails
   */
  async sendPasswordResetEmail(email: string, data: PasswordResetEmailData): Promise<void> {
    const { SENDGRID_API_KEY } = this.c.env

    try {
      if (SENDGRID_API_KEY) {
        // Use SendGrid template for better email design
        await this.sendPasswordResetWithTemplate(email, data)
      }
      else {
        // Fallback to inline HTML for other providers
        const { username, resetUrl, expiryHours } = data
        const subject = 'Password Reset Request'
        const html = this.generatePasswordResetHTML(username, resetUrl, expiryHours)
        const text = this.generatePasswordResetText(username, resetUrl, expiryHours)

        await this.sendEmail({
          to: email,
          subject,
          html,
          text,
        })
      }

      this.logger.info('Password reset email sent successfully', {
        email: this.maskEmail(email),
        username: data.username,
        timestamp: new Date().toISOString(),
      })
    }
    catch (error) {
      this.logger.error('Failed to send password reset email', {
        email: this.maskEmail(email),
        username: data.username,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }

  /**
   * Sends password reset email using SendGrid template
   *
   * @param email - Recipient email address
   * @param data - Password reset email data
   * @returns Promise that resolves when email is sent
   * @throws {Error} When email sending fails
   */
  private async sendPasswordResetWithTemplate(email: string, data: PasswordResetEmailData): Promise<void> {
    const { SENDGRID_API_KEY, SENDGRID_TEMPLATE_ID, SMTP_FROM } = this.c.env

    if (!SENDGRID_TEMPLATE_ID) {
      throw new Error('SENDGRID_TEMPLATE_ID is required for template-based emails')
    }

    const { username, resetUrl } = data
    const fromEmail = SMTP_FROM || 'noreply@yourdomain.com'
    const templateId = SENDGRID_TEMPLATE_ID

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email }],
            subject: 'Password Reset Request',
            dynamic_template_data: {
              username,
              reset_link: resetUrl,
            },
          }],
          from: { email: fromEmail, name: 'Aclc Technical' },
          template_id: templateId,
        }),
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`SendGrid template API error: ${response.status} - ${errorData}`)
      }

      this.logger.info('Password reset email sent via SendGrid template', {
        to: this.maskEmail(email),
        template_id: templateId,
        username,
      })
    }
    catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Sends an email using SendGrid
   *
   * @param options - Email options
   * @returns Promise that resolves when email is sent
   * @throws {Error} When email sending fails
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    const { SENDGRID_API_KEY } = this.c.env

    try {
      if (SENDGRID_API_KEY) {
        await this.sendWithSendGrid(options)
      }
      else {
        // Development mode - log email instead of sending
        this.logger.warn('No email provider configured - logging email content', {
          to: this.maskEmail(options.to),
          subject: options.subject,
          html: options.html,
          text: options.text,
        })
      }
    }
    catch (error) {
      this.logger.error('Failed to send email', {
        to: this.maskEmail(options.to),
        subject: options.subject,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      })
      throw new Error('Failed to send email')
    }
  }

  /**
   * Sends email using SendGrid service (for non-template emails)
   * Note: Password reset emails use SendGrid templates via sendPasswordResetWithTemplate()
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<void> {
    const { SENDGRID_API_KEY, SMTP_FROM } = this.c.env
    const fromEmail = SMTP_FROM || 'noreply@yourdomain.com'

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: options.to }],
          subject: options.subject,
        }],
        from: { email: fromEmail },
        content: [
          ...(options.text
            ? [{
              type: 'text/plain',
              value: options.text,
            }]
            : []),
          {
            type: 'text/html',
            value: options.html,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`SendGrid API error: ${response.status} - ${errorData}`)
    }

    this.logger.info('Email sent via SendGrid', {
      to: this.maskEmail(options.to),
      subject: options.subject,
    })
    clearTimeout(timeoutId)
  }

  /**
   * Generates HTML content for password reset email
   */
  private generatePasswordResetHTML(username: string, resetUrl: string, expiryHours: number): string {
    // Escape user-controlled data to prevent XSS
    const safeUsername = escapeHTML(username)
    const safeResetUrl = escapeHTML(resetUrl)

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Lab System</h1>
    </div>
    <div class="content">
        <h2>Reset Your Password</h2>
        <p>Hello <strong>${safeUsername}</strong>,</p>
        <p>We received a request to reset your password for your Lab System account. If you didn't make this request, you can safely ignore this email.</p>
        
        <p>To reset your password, click the button below:</p>
        <a href="${safeResetUrl}" class="button">Reset Password</a>
        
        <div class="warning">
            <strong>Important:</strong> This link will expire in ${expiryHours} hour${expiryHours !== 1 ? 's' : ''}. For security reasons, you can only use this link once.
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${safeResetUrl}</p>
        
        <p>If you continue to have problems, please contact our support team.</p>
        
        <p>Best regards,<br>The Lab System Team</p>
    </div>
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} Lab System. All rights reserved.</p>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generates plain text content for password reset email
   */
  private generatePasswordResetText(username: string, resetUrl: string, expiryHours: number): string {
    return `
Lab System - Reset Your Password

Hello ${username},

We received a request to reset your password for your Lab System account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${resetUrl}

IMPORTANT: This link will expire in ${expiryHours} hour${expiryHours !== 1 ? 's' : ''}. For security reasons, you can only use this link once.

If you continue to have problems, please contact our support team.

Best regards,
The Lab System Team

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Lab System. All rights reserved.
    `.trim()
  }
}
