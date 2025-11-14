# Password Reset Feature Setup Guide

This guide covers the complete setup of the secure password reset feature for the Lab System Backend.

## 🔧 Development Setup

### 1. Environment Variables

Update your `.dev.vars` file with the required variables:

```bash
# Authentication & Security
JWT_SECRET=dev-jwt-secret-key-change-in-production
BCRYPT_COST=10

# Email Configuration - Resend (recommended)
RESEND_API_KEY=re_your_resend_api_key_here
SMTP_FROM=onboarding@resend.dev

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

### 3. Email Provider Setup - Resend

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add it to your `.dev.vars` file as `RESEND_API_KEY`
4. For development, use `onboarding@resend.dev` as the sender

### 4. Install Dependencies

```bash
# Using Bun (recommended)
bun add resend

# Or using npm
npm install resend --legacy-peer-deps
```

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
RESEND_API_KEY=re_your_production_resend_api_key
SMTP_FROM=noreply@yourdomain.com

# App Configuration
APP_URL=https://yourdomain.com
RESET_TOKEN_EXPIRY_HOURS=1
```

### 2. Cloudflare Workers Secrets

Set secrets using Wrangler CLI:

```bash
# Set JWT secret
wrangler secret put JWT_SECRET

# Set Resend API key
wrangler secret put RESEND_API_KEY

# Set other environment variables
wrangler secret put APP_URL
wrangler secret put SMTP_FROM
```

### 3. Domain Configuration

1. Add your domain in Resend dashboard
2. Configure DNS records as instructed by Resend
3. Update `SMTP_FROM` to use your domain: `noreply@yourdomain.com`

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
   - Check Resend API key in environment variables
   - Verify domain configuration in Resend dashboard
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

- [Resend Documentation](https://resend.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Hono Framework Documentation](https://hono.dev/)

## 🔄 Maintenance

### Regular Tasks

1. **Monitor expired tokens:** System automatically cleans up expired tokens
2. **Review email delivery:** Check Resend dashboard for delivery rates and bounces
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
