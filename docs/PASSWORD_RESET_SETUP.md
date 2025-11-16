# Password Reset Feature Setup Guide

This guide covers the complete setup of the secure password reset feature for the Lab System Backend.

## 🔧 Development Setup

### 1. Environment Variables

Update your `.dev.vars` file with the required variables:

```bash
# Authentication & Security
JWT_SECRET=dev-jwt-secret-key-change-in-production
BCRYPT_COST=10

# Email Configuration - SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_TEMPLATE_ID=your_sendgrid_template_id_here
SMTP_FROM=your_verified_email@domain.com

# App Configuration
APP_URL=http://localhost:5173
RESET_TOKEN_EXPIRY_HOURS=1
```

### 2. Database Migration

Run the database migration to create the password reset tokens table:

```bash
# Using Bun (recommended)
bun run db:generate
bun run db:migrate

# Or using npm
npm run db:generate
npm run db:migrate
```

### 3. Email Provider Setup - SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key from the dashboard:
   - Navigate to Settings > API Keys
   - Click "Create API Key"
   - Select "Restricted Access" and enable the "Mail Send" scope
   - Optionally enable "Template Read" if you plan to dynamically manage templates
   - Copy the generated API key (you won't be able to see it again)
3. Create a SendGrid Dynamic Template:
   - Navigate to Email API > Dynamic Templates
   - Click "Create a Dynamic Template"
   - Give it a name (e.g., "Password Reset Email")
   - Click "Add Version" and choose a design method
   - Create your email template with these required variables:
     - `{{username}}` - User's username
     - `{{resetUrl}}` - The password reset link
     - `{{expiryHours}}` - Token expiry time in hours
   - Copy the Template ID from the template settings
4. (Development) For testing: you can use any email as `SMTP_FROM` initially
5. (Production) Verify your sender identity in SendGrid dashboard before deploying:
   - Navigate to Settings > Sender Authentication
   - Verify a Single Sender or authenticate your domain
6. Add the API key to your `.dev.vars` file as `SENDGRID_API_KEY`
7. Add the Template ID to your `.dev.vars` file as `SENDGRID_TEMPLATE_ID`
8. Set `SMTP_FROM` to your email address (must be verified for production)

### 5. Test the Implementation

Start your development server:

```bash
# Using Bun
bun run dev

# Or using npm
npm run dev
```

Test the endpoints using your preferred method:

**Request Password Reset:**

```bash
curl -X POST http://localhost:8787/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Validate Reset Token:**

```bash
curl "http://localhost:8787/auth/validate-reset-token?token=your_token_here"
```

**Reset Password:**

```bash
curl -X POST http://localhost:8787/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"your_token_here","newPassword":"NewPassword123"}'
```

## 🚀 Production Setup

### 1. Environment Variables

Update your production environment (Cloudflare Workers) with:

```bash
# Required for production
JWT_SECRET=your-super-secure-jwt-secret-here
BCRYPT_COST=12

# Email Configuration
SENDGRID_API_KEY=your_production_sendgrid_api_key
SENDGRID_TEMPLATE_ID=your_sendgrid_template_id
SMTP_FROM=noreply@yourdomain.com

# App Configuration
APP_URL=https://yourdomain.com
RESET_TOKEN_EXPIRY_HOURS=1
```

### 2. Cloudflare Workers Secrets

Set secrets using Wrangler CLI:

> **Note:** When creating your SendGrid API key, ensure it has the "Mail Send" scope enabled. Optionally grant "Template Read" if you plan to dynamically manage templates.

```bash
# Set JWT secret
wrangler secret put JWT_SECRET

# Set SendGrid API key
wrangler secret put SENDGRID_API_KEY

# Set other environment variables
wrangler secret put APP_URL
wrangler secret put SMTP_FROM
```

### 3. Domain Configuration

1. Verify your domain in SendGrid dashboard
2. Configure DNS records as instructed by SendGrid
3. Update `SMTP_FROM` to use your verified domain: `noreply@yourdomain.com`

### 4. Database Migration

Ensure your production database has the password reset tokens table:

```bash
# Using Bun
bun run db:migrate

# Or using npm
npm run db:migrate
```

### 5. Deploy

```bash
# Using Bun
bun run deploy

# Or using npm
npm run deploy
```

## 📋 API Endpoints

### POST /auth/forgot-password

Request a password reset email.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If an account with that email exists, we have sent a password reset link."
}
```

### GET /auth/validate-reset-token

Validate a reset token without consuming it.

**Query Parameters:**

- `token`: The reset token from the email

**Response (Valid):**

```json
{
  "valid": true,
  "message": "Token is valid",
  "user": {
    "username": "john_doe",
    "email": "john@example.com"
  },
  "expiresAt": "2025-01-21T15:30:00.000Z"
}
```

**Response (Invalid):**

```json
{
  "valid": false,
  "message": "Invalid or expired reset token"
}
```

### POST /auth/reset-password

Reset password using a valid token.

**Request:**

```json
{
  "token": "selector.verifier",
  "newPassword": "NewSecurePassword123"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Invalid or expired reset token. Please request a new password reset."
}
```

## 🔒 Security Features

### Token Security

- **Selector/Verifier Pattern**: Tokens are split into public selector and secret verifier
- **Hashed Storage**: Only verifier hash is stored in database
- **Time-Limited**: Configurable expiry (default: 1 hour)
- **Single-Use**: Tokens are marked as used after consumption
- **Automatic Cleanup**: Expired tokens are automatically removed

### Anti-Enumeration

- Same response for existing and non-existing emails
- Timing attack protection with random delays
- No information leakage about user existence

### Rate Limiting Friendly

- Constant-time token validation
- Efficient database queries with proper indexing
- No user enumeration vectors

## 🧪 Testing

### Frontend Integration

The password reset feature provides three main endpoints for frontend integration:

1. **POST** `/auth/forgot-password` - Request password reset
2. **GET** `/auth/validate-reset-token` - Validate reset token
3. **POST** `/auth/reset-password` - Complete password reset

See the API documentation for detailed request/response schemas.

### Manual Testing

1. **Request Reset:**
   - Send POST request to `/auth/forgot-password` with email
   - Check email inbox for reset link
   - Verify email content and styling

2. **Validate Token:**
   - Extract token from email URL
   - Send GET request to `/auth/validate-reset-token?token=...`
   - Verify token validation response

3. **Reset Password:**
   - Send POST request to `/auth/reset-password` with token and new password
   - Verify successful reset response
   - Test login with new password

### Automated Testing

Add tests to your test suite:

```typescript
// Example test structure using Bun's built-in test runner
import { describe, expect, test } from 'bun:test'

describe('Password Reset', () => {
  test('should request password reset', async () => {
    // Test forgot password endpoint
    const response = await fetch('http://localhost:8787/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    })
    expect(response.status).toBe(200)
  })

  test('should validate reset token', async () => {
    // Test token validation
  })

  test('should reset password', async () => {
    // Test password reset
  })
})
```

Run tests:

```bash
# Using Bun
bun test

# Or using npm
npm run test
```

## 🔧 Troubleshooting

### Common Issues

1. **Email not sending:**
   - Verify environment variables are set: `SENDGRID_API_KEY`, `SENDGRID_TEMPLATE_ID`, `SMTP_FROM`
   - Check API key has "Mail Send" scope enabled in SendGrid dashboard
   - Verify the Template ID matches your SendGrid dynamic template
   - (Production only) Verify sender identity in SendGrid dashboard
   - Check server logs for email service errors

2. **Token validation fails:**
   - Verify token format (selector.verifier)
   - Check token expiry settings (default: 1 hour)
   - Ensure database migration ran successfully

3. **CORS issues:**
   - Update CORS settings in `src/lib/create-app.ts`
   - Add your frontend domain to allowed origins

4. **Database errors:**
   - Ensure migration ran successfully
   - Check database connection string
   - Verify foreign key constraints

### Performance Monitoring

Monitor these metrics in production:

- Password reset request rate
- Email delivery success rate
- Token validation success rate
- Password reset completion rate
- Database query performance

## 📚 Additional Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Hono Framework Documentation](https://hono.dev/)

## 🔄 Maintenance

### Regular Tasks

1. **Monitor expired tokens:** System automatically cleans up expired tokens
2. **Review email delivery:** Check SendGrid dashboard for delivery rates and bounces
3. **Update dependencies:** Keep dependencies updated using Bun or npm
4. **Security audits:** Regularly review token generation and validation logic

### Scaling Considerations

- Implement rate limiting for password reset requests
- Monitor email service quotas and upgrade as needed
- Set up proper logging and alerting for security events
- Consider adding CAPTCHA for high-volume applications

### Dependency Updates

```bash
# Using Bun (recommended)
bun update

# Or using npm
npm update
```
