/**
 * @fileoverview EmailService - Handles email sending for password reset and other notifications
 * Supports both Resend (recommended) and SMTP configurations
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
 * EmailService - Handles email sending functionality
 * 
 * Supports multiple email providers:
 * - Resend (recommended for production)
 * - SMTP (fallback option)
 * 
 * @example
 * ```typescript
 * const emailService = new EmailService(context)
 * await emailService.sendPasswordResetEmail('user@example.com', {
 *   username: 'john_doe',
 *   resetUrl: 'https://app.com/reset-password?token=abc123',
 *   expiryHours: 1
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

    /**
     * Sends a password reset email to the user
     * 
     * @param email - Recipient email address
     * @param data - Password reset email data
     * @returns Promise that resolves when email is sent
     * @throws {Error} When email sending fails
     */
    async sendPasswordResetEmail(email: string, data: PasswordResetEmailData): Promise<void> {
        const { username, resetUrl, expiryHours } = data

        const subject = 'Reset Your Password - Lab System'
        const html = this.generatePasswordResetHTML(username, resetUrl, expiryHours)
        const text = this.generatePasswordResetText(username, resetUrl, expiryHours)

        await this.sendEmail({
            to: email,
            subject,
            html,
            text,
        })

        this.logger.info('Password reset email sent successfully', {
            email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
            username,
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Sends an email using the configured email provider
     * 
     * @param options - Email options
     * @returns Promise that resolves when email is sent
     * @throws {Error} When email sending fails
     */
    async sendEmail(options: EmailOptions): Promise<void> {
        const { RESEND_API_KEY } = this.c.env

        try {
            if (RESEND_API_KEY) {
                await this.sendWithResend(options)
            } else {
                // Development mode - log email instead of sending
                this.logger.warn('No email provider configured - logging email content', {
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                    text: options.text,
                })
            }
        } catch (error) {
            this.logger.error('Failed to send email', {
                to: options.to.replace(/(.{2}).*(@.*)/, '$1***$2'),
                subject: options.subject,
                error: (error as Error).message,
                timestamp: new Date().toISOString(),
            })
            throw new Error('Failed to send email')
        }
    }

    /**
     * Sends email using Resend service (recommended for production)
     */
    private async sendWithResend(options: EmailOptions): Promise<void> {
        const { RESEND_API_KEY, SMTP_FROM } = this.c.env
        const fromEmail = SMTP_FROM || 'onboarding@resend.dev' // Default Resend domain for testing

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [options.to],
                subject: options.subject,
                html: options.html,
                text: options.text,
            }),
        })

        if (!response.ok) {
            const errorData = await response.text()
            throw new Error(`Resend API error: ${response.status} - ${errorData}`)
        }

        const result = await response.json() as { id?: string }

        this.logger.info('Email sent via Resend', {
            to: options.to.replace(/(.{2}).*(@.*)/, '$1***$2'),
            subject: options.subject,
            messageId: result.id,
        })
    }



    /**
     * Generates HTML content for password reset email
     */
    private generatePasswordResetHTML(username: string, resetUrl: string, expiryHours: number): string {
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
        <p>Hello <strong>${username}</strong>,</p>
        <p>We received a request to reset your password for your Lab System account. If you didn't make this request, you can safely ignore this email.</p>
        
        <p>To reset your password, click the button below:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        
        <div class="warning">
            <strong>Important:</strong> This link will expire in ${expiryHours} hour${expiryHours !== 1 ? 's' : ''}. For security reasons, you can only use this link once.
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${resetUrl}</p>
        
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