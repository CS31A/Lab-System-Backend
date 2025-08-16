### Auth Handlers

Handlers for authentication-related operations. These follow the project-wide conventions:

- Response shape: `{ message, data }`
- Input validation: handled by OpenAPI schemas; use `c.req.valid('json')`
- Logging: use `c.var.logger` with contextual details

Included handlers:

- `LoginHandler`: Validates credentials, sets `accessToken` and `refreshToken` httpOnly cookies.
- `RefreshHandler`: Uses `refreshToken` cookie to issue a new short-lived `accessToken`.
- `LogoutHandler`: Invalidates current refresh session and clears cookies.
- `GetMeHandler`: Returns minimal info from JWT payload (`sub`, `role`).

Security notes:

- Tokens are stored in httpOnly cookies to mitigate XSS. The `secure` flag is enabled in production.
- Access token TTL: 15 minutes. Refresh token TTL: 7 days.

